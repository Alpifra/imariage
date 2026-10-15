# Executables (local)
DOCKER_COMP = docker compose -f infrastructure/docker/compose.yml

# Docker containers
PHP_CONT   = $(DOCKER_COMP) exec php
DB_CONT    = $(DOCKER_COMP) exec database
FRONT_CONT = $(DOCKER_COMP) exec front

# Executables
PHP      = $(PHP_CONT) php
COMPOSER = $(PHP_CONT) composer
SYMFONY  = $(PHP_CONT) bin/console
PHPSTAN  = $(PHP_CONT) vendor/bin/phpstan
CSFIXER  = $(PHP_CONT) vendor/bin/php-cs-fixer
NPM      = $(FRONT_CONT) npm

# Misc
.DEFAULT_GOAL = help
.PHONY        : help build up start down logs sh worker mysql front-sh composer vendor sf cc analyse lint fix db drop test-db test npm

## —— 🎵 🐳 iMariage Makefile 🐳 🎵 ————————————————————————————————————————————
help: ## Outputs this help screen
	@grep -E '(^[a-zA-Z0-9_-]+:.*?##.*$$)|(^##)' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}{printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}' | sed -e 's/\[32m##/[33m/'

## —— Docker 🐳 ————————————————————————————————————————————————————————————————
build: ## Builds the Docker images
	@$(DOCKER_COMP) build --pull --no-cache

up: ## Start the docker hub in detached mode (no logs)
	@$(DOCKER_COMP) up --detach

start: build up ## Build and start the containers

down: ## Stop the docker hub
	@$(DOCKER_COMP) down --remove-orphans

logs: ## Show live logs
	@$(DOCKER_COMP) logs --tail=0 --follow

sh: ## Connect to the PHP FPM container
	@$(PHP_CONT) sh

worker: ## Restart the Messenger worker (it keeps the old code in memory)
	@$(DOCKER_COMP) restart worker

mysql: ## Connect to the database with the MariaDB client
	@$(DB_CONT) mariadb -u imariage -ppassword imariage

front-sh: ## Connect to the front (Node) container
	@$(FRONT_CONT) sh

## —— Composer 🧙 ——————————————————————————————————————————————————————————————
composer: ## Run composer, pass the parameter "c=" to run a given command, example: make composer c='req symfony/orm-pack'
	@$(eval c ?=)
	@$(COMPOSER) $(c)

vendor: ## Install vendors according to the current composer.lock file
vendor: c=install --prefer-dist --no-progress --no-interaction
vendor: composer

## —— Symfony 🎵 ———————————————————————————————————————————————————————————————
sf: ## List all Symfony commands or pass the parameter "c=" to run a given command, example: make sf c="about"
	@$(eval c ?=)
	@$(SYMFONY) $(c)

cc: c=c:c ## Clear the cache
cc: sf

## —— Quality ✅ ————————————————————————————————————————————————————————————————
analyse: ## Perform a static PHP code test of the project, see config file ./api/phpstan.dist.neon
	@$(PHPSTAN) analyse --memory-limit=512M

lint: ## Check PHP code style (dry run) and front lint
	@$(CSFIXER) fix --dry-run --diff
	@$(NPM) run lint

fix: ## Fix PHP code style
	@$(CSFIXER) fix

## —— Database 💾 ———————————————————————————————————————————————————————————————
db: ## Create and migrate database
	@$(SYMFONY) doctrine:database:create -n --if-not-exists
	@$(SYMFONY) doctrine:migrations:migrate -n --allow-no-migration

test-db: ## Create the test database (granted with the MariaDB root account) and migrate it
	@$(DB_CONT) sh -c 'mariadb -uroot -p"$$MARIADB_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS imariage_test; GRANT ALL ON imariage_test.* TO \`$$MARIADB_USER\`@\`%\`"'
	@$(PHP_CONT) bin/console doctrine:migrations:migrate -n --allow-no-migration --env=test

test: ## Run the PHPUnit tests, pass the parameter "c=" to add options, example: make test c="--filter=Photo"
	@$(PHP_CONT) bin/phpunit $(c)

drop: ## Drop the database
	@$(SYMFONY) doctrine:database:drop --force --if-exists

## —— Front ⚛️ ——————————————————————————————————————————————————————————————————
npm: ## Run npm in the front container, pass the parameter "c=" to run a given command, example: make npm c='install axios'
	@$(eval c ?=)
	@$(NPM) $(c)
