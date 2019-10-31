'use strict';

/**
 * @license
 * Copyright SOAJS All Rights Reserved.
 *
 * Use of this source code is governed by an Apache license that can be
 * found in the LICENSE file at the root of this repository
 */

const log = require('util').log;
const spawn = require('child_process').spawn;
const utils = require('../utils');
const async = require("async");
const gateway = require('./lib/gateway.js');
const console = require('./lib/console.js');
const sites = require('./lib/sites.js');
const fs = require('fs');
const path = require('path');

/**
 * Function that runs nginx service and prints logs to stdout
 * @param  {Function} cb Callback Function
 *
 */
function startNginx(cb) {
	const nginx = spawn('./bin/nginx.sh', {stdio: 'inherit'});
	
	nginx.on('data', (data) => {
		log(data.toString());
	});
	
	nginx.on('close', (code) => {
		log(`Nginx process exited with code: ${code}`);
		return cb();
	});
	nginx.on('error', (error) => {
		log(`Nginx process failed with error: ${error}`);
		return cb(error);
	});
}

const exp = {
	
	"deploy": (options, cb) => {
		let installFnArray = [(cb) => {
			cb(null, options);
		}];
		installFnArray.push((obj, cb) => {
			if (process.env.SOAJS_SITES_CONFIG) {
				let sitesObj = null;
				try {
					sitesObj = JSON.parse(process.env.SOAJS_SITES_CONFIG);
				} catch (e) {
					log('Unable to parse the content of SOAJS_SITES_CONFIG ...');
					log(e);
					return cb(null, obj);
				}
				let config = {
					"content": 'nginx',
					"type": 'sites'
				};
				sites.sitesDeploy(obj, config, sitesObj, (error) => {
					return cb(error, obj);
				});
			} else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			let config = {
				"content": 'nginx',
				"type": 'sites'
			};
			sites.customDeploy(obj, config, (error) => {
				return cb(error, obj);
			});
		});
		async.waterfall(installFnArray, (err) => {
			if (err) {
				throw err;
			}
			return cb();
		});
	},
	"install": (options, cb) => {
		let installFnArray = [(cb) => {
			options.sslDomain = [];
			cb(null, options);
		}];
		
		installFnArray.push((obj, cb) => {
			obj.sslConfiguration = null;
			if (process.env.SOAJS_SSL_CONFIG) {
				let configuration = null;
				try {
					configuration = JSON.parse(process.env.SOAJS_SSL_CONFIG);
				} catch (e) {
					log('Unable to parse the content of SOAJS_SSL_CONFIG ...');
					log(e);
					return cb(null, obj);
				}
				obj.sslConfiguration = configuration;
				
				let sslDomainStr = null;
				
				if (configuration && configuration.domains && Array.isArray(configuration.domains) && configuration.domains.length > 0) {
					obj.sslDomain = obj.sslDomain.concat(configuration.domains);
				}
				if (obj.sslDomain.length > 0) {
					sslDomainStr = obj.sslDomain.join(",");
				}
				if (sslDomainStr) {
					let filePath = path.join(obj.paths.nginx.cert, "domains");
					fs.writeFile(filePath, obj.sslDomain, (error) => {
						if (error) {
							log(`An error occurred while writing ${filePath}, for ssl domain ...`);
							return cb(error, obj);
						}
						
						return cb(null, obj);
					});
				} else {
					return cb(null, obj);
				}
			} else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			if (process.env.SOAJS_GATEWAY_CONFIG) {
				log('Fetching SOAJS Gateway configuration ...');
				gateway.conf(process.env.SOAJS_GATEWAY_CONFIG, (gatewayConf) => {
					obj.gatewayConf = gatewayConf;
					if (obj.gatewayConf && obj.gatewayConf.domain) {
						obj.sslDomain.push(obj.gatewayConf.domain);
					}
					return cb(null, obj);
				});
			} else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			if (obj.gatewayConf) {
				log('Creating SOAJS Gateway needed upstream ...');
				gateway.upstream({
					"location": obj.paths.nginx.conf + "/conf.d/",
					"ip": obj.gatewayConf.ip,
					"port": obj.gatewayConf.port,
					"label": obj.nginx.label
				}, (done) => {
					if (done) {
						log('Upstream created successfully.');
					}
					return cb(null, obj);
				});
			} else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			if (obj.gatewayConf) {
				log('Creating SOAJS Gateway needed api.conf ...');
				gateway.api({
					"location": obj.paths.nginx.conf + "/sites-enabled/",
					"domain": obj.gatewayConf.domain,
					"label": obj.nginx.label,
					"ssl": obj.sslConfiguration
				}, (done) => {
					if (done) {
						log('api.conf created successfully.');
					}
					return cb(null, obj);
				});
			} else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			if (obj.gatewayConf) {
				if (!process.env.SOAJS_ENV || ['dashboard'].indexOf(process.env.SOAJS_ENV.toLowerCase()) === -1) {
					return cb(null, obj);
				}
				
				log('Update SOAJS console UI with the right ext KEY ...');
				console.updateConfig({
					"location": obj.paths.nginx.site + "soajs.dashboard.ui/",
					"domainPrefix": obj.gatewayConf.domainPrefix,
					"extKey": process.env.SOAJS_EXTKEY
				}, (error, done) => {
					if (done) {
						log('SOAJS console UI updated successfully.');
					}
					return cb(null, obj);
				});
			} else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			let config = {
				"content": 'nginx',
				"type": 'sites-enabled',
				"target": obj.paths.nginx.conf + "/sites-enabled/"
			};
			utils.import(options, config, (error) => {
				if (error) {
					throw new Error(error);
				}
				return cb(null, obj);
			});
		});
		installFnArray.push((obj, cb) => {
			let config = {
				"content": 'nginx',
				"type": 'nginx.conf',
				"target": obj.paths.nginx.conf
			};
			utils.import(options, config, (error) => {
				if (error) {
					throw new Error(error);
				}
				return cb(null, obj);
			});
		});
		installFnArray.push((obj, cb) => {
			if (process.env.SOAJS_SITES_CONFIG) {
				let sitesObj = null;
				try {
					sitesObj = JSON.parse(process.env.SOAJS_SITES_CONFIG);
				} catch (e) {
					log('Unable to parse the content of SOAJS_SITES_CONFIG ...');
					log(e);
					return cb(null, obj);
				}
				let config = {
					"content": 'nginx',
					"type": 'sites'
				};
				sites.sitesInstall(obj, config, sitesObj, (error) => {
					return cb(error, obj);
				});
			} else {
				return cb(null, obj);
			}
		});
		installFnArray.push((obj, cb) => {
			let config = {
				"content": 'nginx',
				"type": 'sites'
			};
			sites.customInstall(obj, config, (error) => {
				return cb(error, obj);
			});
		});
		async.waterfall(installFnArray, (err) => {
			if (err) {
				throw err;
			}
			return cb();
		});
	},
	"run": (options, cb) => {
		// Start nginx
		startNginx(cb);
	}
};

//module.exports = exp;
module.exports = {
	deploy: exp.deploy,
	install: exp.install,
	run: exp.run
};