ARG PHP_VERSION=8.5

FROM php:${PHP_VERSION}-fpm-alpine

RUN apk add --no-cache \
		acl \
		fcgi \
		file \
		gettext \
		git \
		imagemagick-heic \
	;

COPY --from=mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/

RUN install-php-extensions \
		apcu \
		imagick \
		intl \
		opcache \
		pdo_mysql \
		zip \
	;

RUN ln -s $PHP_INI_DIR/php.ini-production $PHP_INI_DIR/php.ini
COPY php/conf.d/symfony.prod.ini $PHP_INI_DIR/conf.d/symfony.ini

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

ENV COMPOSER_ALLOW_SUPERUSER=1

WORKDIR /srv/app

CMD ["php-fpm"]
