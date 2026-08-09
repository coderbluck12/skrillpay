const https = require('https');
const { URL } = require('url');

function request(options: any, data: any = null): Promise<any> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(options.url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = https.request(reqOptions, (res: any) => {
      let body = '';
      res.on('data', (chunk: any) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            resolve({ status: res.statusCode, data: parsed, isError: true });
          }
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (err: any) => {
      reject(err);
    });

    if (data) {
      req.write(typeof data === 'object' ? JSON.stringify(data) : data);
    }
    req.end();
  });
}

export default request;
