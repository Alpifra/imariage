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
NPM      = $(FRONT_CONT) npm

# Misc
.DEFAULT_GOAL = help
.PHONY        : help build up start down logs sh mysql front-sh composer vendor sf cc db drop npm

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

## —— Database 💾 ———————————————————————————————————————————————————————————————
db: ## Create and migrate database
	@$(SYMFONY) doctrine:database:create -n --if-not-exists
	@$(SYMFONY) doctrine:migrations:migrate -n --allow-no-migration

drop: ## Drop the database
	@$(SYMFONY) doctrine:database:drop --force --if-exists

## —— Front ⚛️ ——————————————————————————————————————————————————————————————————
npm: ## Run npm in the front container, pass the parameter "c=" to run a given command, example: make npm c='install axios'
	@$(eval c ?=)
	@$(NPM) $(c)
