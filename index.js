/* jshint node: true */
'use strict';
var AWS = require('aws-sdk');
var BasePlugin = require('ember-cli-deploy-plugin');
var fs = require('fs');
var ProgressBar = require('progress');

module.exports = {
  name: 'ember-cli-deploy-elastic-beanstalk',
  createDeployPlugin: function(options) {
    var DeployPlugin = BasePlugin.extend({
      name: options.name,
      configure: function(options) {
        var self = this;

        var required = [
          'AWS_ACCESS_KEY_ID',
          'AWS_SECRET_ACCESS_KEY',
          'REGION',
          'BUCKET',
          'APPLICATION_NAME',
          'ENVIRONMENT_NAME'
        ];

        var err;
        required.forEach(function(value) {
          if(!options.config.eb[value]) {
            err = true;
            self.log('Please add ' + value + ' to your ENV.eb object in config/deploy.js', { color: 'red' });
          }
        });

        if(err) {
          throw "- Deployment aborted: one or more of the required properties is missing";
        }

        AWS.config.update({
          accessKeyId: options.config.eb.AWS_ACCESS_KEY_ID,
          secretAccessKey: options.config.eb.AWS_SECRET_ACCESS_KEY,
          region: options.config.eb.REGION,
        });

        return {
          ebOptions: {
            SOURCE_FILE: options.config.eb.SOURCE_FILE || 'archive.zip',
            TARGET_PREFIX: options.config.eb.TARGET_PREFIX || 'ember-deploy-',
            TARGET_POSTFIX: options.config.eb.TARGET_POSTFIX || Date.now(),
            TARGET_EXTENSION: options.config.eb.TARGET_EXTENSION || '.zip'
          }
        };
      },

      upload: function(context) {
        var bar = new ProgressBar('uploading [:bar] :percent :etas', {
          complete: '=',
          incomplete: ' ',
          width: 20,
          total: 1
        });

        return new Promise(function(resolve, reject) {
          var body = fs.createReadStream(context.ebOptions.SOURCE_FILE);
          var key = context.ebOptions.TARGET_PREFIX + context.ebOptions.TARGET_POSTFIX + context.ebOptions.TARGET_EXTENSION;
          var s3obj = new AWS.S3({params: {Bucket: context.config.eb.BUCKET, Key: key}});
          var previousChunk = 0;
          var progress = 0;
          s3obj.upload({Body: body})
            .on('httpUploadProgress', function(e) {
                progress = (e.loaded/e.total) - previousChunk;
                previousChunk = (e.loaded/e.total);
                bar.tick(progress);
            })
            .send(function(err, data) {
              console.log('S3 console: https://console.aws.amazon.com/s3/home?region=' + context.config.eb.REGION + '#&bucket=' + context.config.eb.BUCKET);
              console.log('S3 link: https://s3-' + context.config.eb.REGION +'.amazonaws.com/' + context.config.eb.BUCKET + '/' + key + '\n');
              if(err) {
                reject({error: err});
              }
              else {
                resolve({upload: data});
              }
            });
        });
      },

      didUpload: function(context) {
        var elasticbeanstalk = new AWS.ElasticBeanstalk();

        var params = {
          ApplicationName: context.config.eb.APPLICATION_NAME,
          AutoCreateApplication: true,
          Description: process.argv[4] || '',
          Process: true,
          SourceBundle: {
            S3Bucket: context.config.eb.BUCKET,
            S3Key: context.upload.Key,
          },
          VersionLabel: context.upload.Key
         };

         return new Promise(function(resolve, reject) {
           elasticbeanstalk.createApplicationVersion(params, function(err) {
             if (err) {
               reject(err);
             }
             else {
               var params = {
                 EnvironmentName: context.config.eb.ENVIRONMENT_NAME,
                 VersionLabel: context.upload.Key
                };
                elasticbeanstalk.updateEnvironment(params, function(err, data) {
                  if (err) {
                    reject(err);
                  }
                  else {
                    console.log('https://' + context.config.eb.REGION + '.console.aws.amazon.com/elasticbeanstalk/home?region=' + context.config.eb.REGION + '#/environment/dashboard?applicationName=' + data.ApplicationName + '&environmentId=' + data.EnvironmentId);
                    resolve({didUpload: data});
                  }
                });
             }
           });
         });
      }
    });

    return new DeployPlugin();
  }
};
