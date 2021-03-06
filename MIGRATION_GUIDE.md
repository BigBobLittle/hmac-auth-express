# Migration Guide

## Migrating from 3.x.x to 4.0.0 [#2](https://github.com/connorjburton/hmac-auth-express/issues/2)

Previously, the documentation incorrectly stated the header and HMAC digest expected a UNIX timestamp, this however was incorrect as the middleware expected a `UNIX timestamp / 1000`. `4.0.0` now expects you to actually pass a UNIX timestamp.

  ```diff
  const crypto = require('crypto');

  const hmac = crypto.createHmac('sha256', 'secret');
  - const time = Math.floor(Date.now() / 1000).toString();
  + const time = Date.now().toString();

  hmac.update(time);
  hmac.update('POST');
  hmac.update('/api/order');

  const contentHash = crypto.createHash('md5');
  contentHash.update(JSON.stringify({"foo": "bar"}));

  hmac.update(contentHash.digest('hex'));

  console.log(`HMAC ${time}:${hmac.digest('hex')}`);
  ```

## Migrating from 2.x.x to 3.0.0 [#1](https://github.com/connorjburton/hmac-auth-express/issues/1)

In case of an error (e.g. the hmac verification failed), the middleware will no longer send a response by itself. Instead an error will be passed to [express' error handler](http://expressjs.com/en/guide/error-handling.html#writing-error-handlers).

- `options.error` is removed and will be ignored.

  ```diff
  const hmac = require('hmac-auth-express');

  app.use('/api', hmac('secret', {
    algorithm: 'sha512',
    identifier: 'APP',
    header: 'authorization',
    maxInterval: 600,
  - error: 'Sorry, that request wasn\'t valid'
  });
  ```

- Add an error handler ([see this guide](http://expressjs.com/en/guide/error-handling.html#writing-error-handlers)) or extend your existing error handler. The error of this middleware can be required as `HMACAuthError` to check against the error instance, or you can check against the error code `ERR_HMAC_AUTH_INVALID`.

  ```javascript
  const { HMACAuthError } = require('hmac-auth-express/src/errors');

  // express' error handler
  app.use((error, req, res, next) => {
    // check by error instance
    if (error instanceof HMACAuthError) {
      res.status(401).send('Invalid request')
    }

    // alternative: check by error code
    if (error.code === 'ERR_HMAC_AUTH_INVALID') {
      res.status(401).send('Invalid request')
    }

    else {
      // ... handle other errors
    }
  })
  ```
