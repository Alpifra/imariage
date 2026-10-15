<?php

namespace App\Photo;

final class ImageProcessor
{
    public const int THUMBNAIL_SHORT_SIDE = 400;
    public const int MEDIUM_LONG_SIDE = 1600;
    private const int JPEG_QUALITY = 82;

    /**
     * @throws \ImagickException
     */
    public function process(string $blob): ProcessedImage
    {
        $source = new \Imagick();
        $source->readImageBlob($blob);
        $source->setIteratorIndex(0);

        $takenAt = $this->readTakenAt($source);

        $source->autoOrient();
        $iccProfiles = $source->getImageProfiles('icc');

        $source->setImageBackgroundColor('white');
        $image = $source->mergeImageLayers(\Imagick::LAYERMETHOD_FLATTEN);
        $source->clear();

        // Drops EXIF (GPS included) from displayed versions; the colour profile is put back
        // so that wide-gamut phone photos do not look washed out
        $image->stripImage();
        if (isset($iccProfiles['icc'])) {
            $image->profileImage('icc', $iccProfiles['icc']);
        }

        $image->setImageFormat('jpeg');
        $image->setImageCompressionQuality(self::JPEG_QUALITY);
        $image->setInterlaceScheme(\Imagick::INTERLACE_PLANE);

        $width = $image->getImageWidth();
        $height = $image->getImageHeight();

        $medium = clone $image;
        if (max($width, $height) > self::MEDIUM_LONG_SIDE) {
            $medium->resizeImage(self::MEDIUM_LONG_SIDE, self::MEDIUM_LONG_SIDE, \Imagick::FILTER_LANCZOS, 1, true);
        }

        // Grid tiles are square crops, so the short side drives the sharpness
        $thumbnail = clone $image;
        if (min($width, $height) > self::THUMBNAIL_SHORT_SIDE) {
            $width < $height
                ? $thumbnail->resizeImage(self::THUMBNAIL_SHORT_SIDE, 0, \Imagick::FILTER_LANCZOS, 1)
                : $thumbnail->resizeImage(0, self::THUMBNAIL_SHORT_SIDE, \Imagick::FILTER_LANCZOS, 1);
        }

        $result = new ProcessedImage($thumbnail->getImageBlob(), $medium->getImageBlob(), $width, $height, $takenAt);

        foreach ([$image, $medium, $thumbnail] as $imagick) {
            $imagick->clear();
        }

        return $result;
    }

    private function readTakenAt(\Imagick $image): ?\DateTimeImmutable
    {
        foreach (['exif:DateTimeOriginal', 'exif:DateTimeDigitized', 'exif:DateTime'] as $property) {
            // Returns false at runtime when the property is missing, despite the stub
            $value = trim((string) $image->getImageProperty($property));
            if ('' === $value) {
                continue;
            }

            // EXIF dates carry no timezone: they are camera local time, i.e. the wedding's
            $date = \DateTimeImmutable::createFromFormat('Y:m:d H:i:s', $value);
            if (false !== $date && (int) $date->format('Y') > 1970) {
                return $date;
            }
        }

        return null;
    }
}
