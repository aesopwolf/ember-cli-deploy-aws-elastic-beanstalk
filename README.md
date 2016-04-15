# ember-cli-deploy-aws-elastic-beanstalk

> This addon uploads a zipped file of your project to AWS Elastic Beanstalk

## Installation
```
$ ember install ember-cli-deploy-aws-elastic-beanstalk
```

## Quick Start

1. Optional: install [ember-cli-deploy-zip](https://github.com/aesopwolf/ember-cli-deploy-zip) to generate an `archive.zip` file automatically
1. Use the following boilerplate to update `config/deploy.js`
```js
if (deployTarget === 'development') {
  ENV.build.environment = 'development';
  ENV.eb = {
    // required:
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    REGION: 'us-west-1',
    BUCKET: 'dev-example-com',
    APPLICATION_NAME: 'example-app',
    ENVIRONMENT_NAME: 'dev',

    // optional. the plugin automatically defaults to these:
    // essentially renames the source file to `ember-deploy-1460673054180.zip`
    SOURCE_FILE: 'archive.zip',
    TARGET_PREFIX: 'ember-deploy-',
    TARGET_POSTFIX: Date.now(),
    TARGET_EXTENSION: '.zip'
  };
}
```
1. Define `process.env.AWS_ACCESS_KEY_ID` inside a `.env` file in the root of your project. [Read more](http://ember-cli-deploy.github.io/ember-cli-deploy/docs/v0.6.x/dotenv-support/)

## Usage
```
$ ember deploy <environment> ["optional description"]
```

For example" `ember deploy staging "deploying from my dev machine"`
