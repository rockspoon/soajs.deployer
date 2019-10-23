# soajs.deployer

soajs deployer runs inside your docker image and helps you deploy from source code and run your application

### SOAJS deployer paths:
Path | Description
--- | -----
/opt/soajs/soajs.deployer | The location of soajs deployer inside the image |
/opt/soajs/soajs.deployer/deployer | The working directory |
/opt/soajs/tmp | the temp directory that deployer use while executing |

### Environment variables

SOAJS deployer allows you to add a configuration content from a git repository. This repository has a working example [https://github.com/soajs/soajs.deployer.example.config]
#### Configuration repository
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_ENV | The environment where you are deploying | [dev] |
SOAJS_CONFIG_ACC_INFO | A stringified JSON object | null | '{"token":null,"provider":"github","owner":"soajs","domain":"github.com"}'
SOAJS_CONFIG_REPO_INFO | A stringified JSON object | null | '{"repo":"soajs.deployer.example.config","branch":"master","commit":null}'

#### Source code repository
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_GIT_ACC_INFO | A stringified JSON object | null | '{"token":null,"provider":"bitbucket","owner":"soajs","domain":"bitbucket.org"}'
SOAJS_GIT_REPO_INFO | A stringified JSON object | null | '{"repo":"soajs.deployer.example.config","branch":"master","commit":null}'
NOTE: if provider is equal to bitbucket then the domain can by bitbucket.org for SaaS or the domain for your enterprise bitbucket installation

### Golang
The deployment path of golang source code is @[/go/src/REPO] where [REPO] is the value set @ SOAJS_GIT_REPO_INFO

### Nodejs
The deployment path of nodejs source code is @[/opt/soajs/node_modules/REPO] where [REPO] is the value set @ SOAJS_GIT_REPO_INFO

ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_NODEJS_MEMORY | Controle nodejs max_old_space_size the number of megabytes allowed | null | 4096
SOAJS_SRV_MAIN | The main file for nodejs application | [.] | app.js

#### NGINX
The configuration path of nginx is /etc/nginx/, if you have a custom location you can set the SOAJS_NX_LOC

ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_GATEWAY_CONFIG | A stringified JSON object | null | '{"ip":"","port":"4000","domain:"api.mydomain.com"}'
SOAJS_SITE_CONFIG | A stringified JSON object | null | '{"domain:"www.mydomain.com","folder":"/"}' or '[{"domain:"www.mydomain.com","folder":"/www"},{"domain:"sub.mydomain.com","folder":"/sub"}]'
SOAJS_NX_LOC | Do not set this if you do not know what you are doing | /etc/nginx/ | 

#### SOAJS console
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_EXTKEY | The tenant external key to use |  |

#### SOAJS service
ENV Variable | Description | Default | Example
--- | ----- | :---: | ---
SOAJS_ENV | The environment where you are deploying | [dev] | [dev]
SOAJS_PROFILE_LOC | The profile location | [/opt/soajs/profiles/] |
SOAJS_REGISTRY_API | Where is the gateway of this env to fetch registry from | [BLANK] | [192.168.5.1:5000]

### License
*Copyright SOAJS All Rights Reserved.*

Use of this source code is governed by an Apache license that can be found in the LICENSE file at the root of this repository.