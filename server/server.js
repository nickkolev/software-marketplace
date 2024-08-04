(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('http'), require('fs'), require('crypto')) :
    typeof define === 'function' && define.amd ? define(['http', 'fs', 'crypto'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Server = factory(global.http, global.fs, global.crypto));
}(this, (function (http, fs, crypto) { 'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var http__default = /*#__PURE__*/_interopDefaultLegacy(http);
    var fs__default = /*#__PURE__*/_interopDefaultLegacy(fs);
    var crypto__default = /*#__PURE__*/_interopDefaultLegacy(crypto);

    class ServiceError extends Error {
        constructor(message = 'Service Error') {
            super(message);
            this.name = 'ServiceError'; 
        }
    }

    class NotFoundError extends ServiceError {
        constructor(message = 'Resource not found') {
            super(message);
            this.name = 'NotFoundError'; 
            this.status = 404;
        }
    }

    class RequestError extends ServiceError {
        constructor(message = 'Request error') {
            super(message);
            this.name = 'RequestError'; 
            this.status = 400;
        }
    }

    class ConflictError extends ServiceError {
        constructor(message = 'Resource conflict') {
            super(message);
            this.name = 'ConflictError'; 
            this.status = 409;
        }
    }

    class AuthorizationError extends ServiceError {
        constructor(message = 'Unauthorized') {
            super(message);
            this.name = 'AuthorizationError'; 
            this.status = 401;
        }
    }

    class CredentialError extends ServiceError {
        constructor(message = 'Forbidden') {
            super(message);
            this.name = 'CredentialError'; 
            this.status = 403;
        }
    }

    var errors = {
        ServiceError,
        NotFoundError,
        RequestError,
        ConflictError,
        AuthorizationError,
        CredentialError
    };

    const { ServiceError: ServiceError$1 } = errors;


    function createHandler(plugins, services) {
        return async function handler(req, res) {
            const method = req.method;
            console.info(`<< ${req.method} ${req.url}`);

            // Redirect fix for admin panel relative paths
            if (req.url.slice(-6) == '/admin') {
                res.writeHead(302, {
                    'Location': `http://${req.headers.host}/admin/`
                });
                return res.end();
            }

            let status = 200;
            let headers = {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            };
            let result = '';
            let context;

            // NOTE: the OPTIONS method results in undefined result and also it never processes plugins - keep this in mind
            if (method == 'OPTIONS') {
                Object.assign(headers, {
                    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Credentials': false,
                    'Access-Control-Max-Age': '86400',
                    'Access-Control-Allow-Headers': 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, X-Authorization, X-Admin'
                });
            } else {
                try {
                    context = processPlugins();
                    await handle(context);
                } catch (err) {
                    if (err instanceof ServiceError$1) {
                        status = err.status || 400;
                        result = composeErrorObject(err.code || status, err.message);
                    } else {
                        // Unhandled exception, this is due to an error in the service code - REST consumers should never have to encounter this;
                        // If it happens, it must be debugged in a future version of the server
                        console.error(err);
                        status = 500;
                        result = composeErrorObject(500, 'Server Error');
                    }
                }
            }

            res.writeHead(status, headers);
            if (context != undefined && context.util != undefined && context.util.throttle) {
                await new Promise(r => setTimeout(r, 500 + Math.random() * 500));
            }
            res.end(result);

            function processPlugins() {
                const context = { params: {} };
                plugins.forEach(decorate => decorate(context, req));
                return context;
            }

            async function handle(context) {
                const { serviceName, tokens, query, body } = await parseRequest(req);
                if (serviceName == 'admin') {
                    return ({ headers, result } = services['admin'](method, tokens, query, body));
                } else if (serviceName == 'favicon.ico') {
                    return ({ headers, result } = services['favicon'](method, tokens, query, body));
                }

                const service = services[serviceName];

                if (service === undefined) {
                    status = 400;
                    result = composeErrorObject(400, `Service "${serviceName}" is not supported`);
                    console.error('Missing service ' + serviceName);
                } else {
                    result = await service(context, { method, tokens, query, body });
                }

                // NOTE: logout does not return a result
                // in this case the content type header should be omitted, to allow checks on the client
                if (result !== undefined) {
                    result = JSON.stringify(result);
                } else {
                    status = 204;
                    delete headers['Content-Type'];
                }
            }
        };
    }



    function composeErrorObject(code, message) {
        return JSON.stringify({
            code,
            message
        });
    }

    async function parseRequest(req) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const tokens = url.pathname.split('/').filter(x => x.length > 0);
        const serviceName = tokens.shift();
        const queryString = url.search.split('?')[1] || '';
        const query = queryString
            .split('&')
            .filter(s => s != '')
            .map(x => x.split('='))
            .reduce((p, [k, v]) => Object.assign(p, { [k]: decodeURIComponent(v) }), {});
        const body = await parseBody(req);

        return {
            serviceName,
            tokens,
            query,
            body
        };
    }

    function parseBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => body += chunk.toString());
            req.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    resolve(body);
                }
            });
        });
    }

    var requestHandler = createHandler;

    class Service {
        constructor() {
            this._actions = [];
            this.parseRequest = this.parseRequest.bind(this);
        }

        /**
         * Handle service request, after it has been processed by a request handler
         * @param {*} context Execution context, contains result of middleware processing
         * @param {{method: string, tokens: string[], query: *, body: *}} request Request parameters
         */
        async parseRequest(context, request) {
            for (let { method, name, handler } of this._actions) {
                if (method === request.method && matchAndAssignParams(context, request.tokens[0], name)) {
                    return await handler(context, request.tokens.slice(1), request.query, request.body);
                }
            }
        }

        /**
         * Register service action
         * @param {string} method HTTP method
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        registerAction(method, name, handler) {
            this._actions.push({ method, name, handler });
        }

        /**
         * Register GET action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        get(name, handler) {
            this.registerAction('GET', name, handler);
        }

        /**
         * Register POST action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        post(name, handler) {
            this.registerAction('POST', name, handler);
        }

        /**
         * Register PUT action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        put(name, handler) {
            this.registerAction('PUT', name, handler);
        }

        /**
         * Register PATCH action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        patch(name, handler) {
            this.registerAction('PATCH', name, handler);
        }

        /**
         * Register DELETE action
         * @param {string} name Action name. Can be a glob pattern.
         * @param {(context, tokens: string[], query: *, body: *)} handler Request handler
         */
        delete(name, handler) {
            this.registerAction('DELETE', name, handler);
        }
    }

    function matchAndAssignParams(context, name, pattern) {
        if (pattern == '*') {
            return true;
        } else if (pattern[0] == ':') {
            context.params[pattern.slice(1)] = name;
            return true;
        } else if (name == pattern) {
            return true;
        } else {
            return false;
        }
    }

    var Service_1 = Service;

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0,
                v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    var util = {
        uuid
    };

    const uuid$1 = util.uuid;


    const data = fs__default['default'].existsSync('./data') ? fs__default['default'].readdirSync('./data').reduce((p, c) => {
        const content = JSON.parse(fs__default['default'].readFileSync('./data/' + c));
        const collection = c.slice(0, -5);
        p[collection] = {};
        for (let endpoint in content) {
            p[collection][endpoint] = content[endpoint];
        }
        return p;
    }, {}) : {};

    const actions = {
        get: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            return responseData;
        },
        post: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            // TODO handle collisions, replacement
            let responseData = data;
            for (let token of tokens) {
                if (responseData.hasOwnProperty(token) == false) {
                    responseData[token] = {};
                }
                responseData = responseData[token];
            }

            const newId = uuid$1();
            responseData[newId] = Object.assign({}, body, { _id: newId });
            return responseData[newId];
        },
        put: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens.slice(0, -1)) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined && responseData[tokens.slice(-1)] !== undefined) {
                responseData[tokens.slice(-1)] = body;
            }
            return responseData[tokens.slice(-1)];
        },
        patch: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            console.log('Request body:\n', body);

            let responseData = data;
            for (let token of tokens) {
                if (responseData !== undefined) {
                    responseData = responseData[token];
                }
            }
            if (responseData !== undefined) {
                Object.assign(responseData, body);
            }
            return responseData;
        },
        delete: (context, tokens, query, body) => {
            tokens = [context.params.collection, ...tokens];
            let responseData = data;

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i];
                if (responseData.hasOwnProperty(token) == false) {
                    return null;
                }
                if (i == tokens.length - 1) {
                    const body = responseData[token];
                    delete responseData[token];
                    return body;
                } else {
                    responseData = responseData[token];
                }
            }
        }
    };

    const dataService = new Service_1();
    dataService.get(':collection', actions.get);
    dataService.post(':collection', actions.post);
    dataService.put(':collection', actions.put);
    dataService.patch(':collection', actions.patch);
    dataService.delete(':collection', actions.delete);


    var jsonstore = dataService.parseRequest;

    /*
     * This service requires storage and auth plugins
     */

    const { AuthorizationError: AuthorizationError$1 } = errors;



    const userService = new Service_1();

    userService.get('me', getSelf);
    userService.post('register', onRegister);
    userService.post('login', onLogin);
    userService.get('logout', onLogout);


    function getSelf(context, tokens, query, body) {
        if (context.user) {
            const result = Object.assign({}, context.user);
            delete result.hashedPassword;
            return result;
        } else {
            throw new AuthorizationError$1();
        }
    }

    function onRegister(context, tokens, query, body) {
        return context.auth.register(body);
    }

    function onLogin(context, tokens, query, body) {
        return context.auth.login(body);
    }

    function onLogout(context, tokens, query, body) {
        return context.auth.logout();
    }

    var users = userService.parseRequest;

    const { NotFoundError: NotFoundError$1, RequestError: RequestError$1 } = errors;


    var crud = {
        get,
        post,
        put,
        patch,
        delete: del
    };


    function validateRequest(context, tokens, query) {
        /*
        if (context.params.collection == undefined) {
            throw new RequestError('Please, specify collection name');
        }
        */
        if (tokens.length > 1) {
            throw new RequestError$1();
        }
    }

    function parseWhere(query) {
        const operators = {
            '<=': (prop, value) => record => record[prop] <= JSON.parse(value),
            '<': (prop, value) => record => record[prop] < JSON.parse(value),
            '>=': (prop, value) => record => record[prop] >= JSON.parse(value),
            '>': (prop, value) => record => record[prop] > JSON.parse(value),
            '=': (prop, value) => record => record[prop] == JSON.parse(value),
            ' like ': (prop, value) => record => record[prop].toLowerCase().includes(JSON.parse(value).toLowerCase()),
            ' in ': (prop, value) => record => JSON.parse(`[${/\((.+?)\)/.exec(value)[1]}]`).includes(record[prop]),
        };
        const pattern = new RegExp(`^(.+?)(${Object.keys(operators).join('|')})(.+?)$`, 'i');

        try {
            let clauses = [query.trim()];
            let check = (a, b) => b;
            let acc = true;
            if (query.match(/ and /gi)) {
                // inclusive
                clauses = query.split(/ and /gi);
                check = (a, b) => a && b;
                acc = true;
            } else if (query.match(/ or /gi)) {
                // optional
                clauses = query.split(/ or /gi);
                check = (a, b) => a || b;
                acc = false;
            }
            clauses = clauses.map(createChecker);

            return (record) => clauses
                .map(c => c(record))
                .reduce(check, acc);
        } catch (err) {
            throw new Error('Could not parse WHERE clause, check your syntax.');
        }

        function createChecker(clause) {
            let [match, prop, operator, value] = pattern.exec(clause);
            [prop, value] = [prop.trim(), value.trim()];

            return operators[operator.toLowerCase()](prop, value);
        }
    }


    function get(context, tokens, query, body) {
        validateRequest(context, tokens);

        let responseData;

        try {
            if (query.where) {
                responseData = context.storage.get(context.params.collection).filter(parseWhere(query.where));
            } else if (context.params.collection) {
                responseData = context.storage.get(context.params.collection, tokens[0]);
            } else {
                // Get list of collections
                return context.storage.get();
            }

            if (query.sortBy) {
                const props = query.sortBy
                    .split(',')
                    .filter(p => p != '')
                    .map(p => p.split(' ').filter(p => p != ''))
                    .map(([p, desc]) => ({ prop: p, desc: desc ? true : false }));

                // Sorting priority is from first to last, therefore we sort from last to first
                for (let i = props.length - 1; i >= 0; i--) {
                    let { prop, desc } = props[i];
                    responseData.sort(({ [prop]: propA }, { [prop]: propB }) => {
                        if (typeof propA == 'number' && typeof propB == 'number') {
                            return (propA - propB) * (desc ? -1 : 1);
                        } else {
                            return propA.localeCompare(propB) * (desc ? -1 : 1);
                        }
                    });
                }
            }

            if (query.offset) {
                responseData = responseData.slice(Number(query.offset) || 0);
            }
            const pageSize = Number(query.pageSize) || 10;
            if (query.pageSize) {
                responseData = responseData.slice(0, pageSize);
            }
    		
    		if (query.distinct) {
                const props = query.distinct.split(',').filter(p => p != '');
                responseData = Object.values(responseData.reduce((distinct, c) => {
                    const key = props.map(p => c[p]).join('::');
                    if (distinct.hasOwnProperty(key) == false) {
                        distinct[key] = c;
                    }
                    return distinct;
                }, {}));
            }

            if (query.count) {
                return responseData.length;
            }

            if (query.select) {
                const props = query.select.split(',').filter(p => p != '');
                responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                function transform(r) {
                    const result = {};
                    props.forEach(p => result[p] = r[p]);
                    return result;
                }
            }

            if (query.load) {
                const props = query.load.split(',').filter(p => p != '');
                props.map(prop => {
                    const [propName, relationTokens] = prop.split('=');
                    const [idSource, collection] = relationTokens.split(':');
                    console.log(`Loading related records from "${collection}" into "${propName}", joined on "_id"="${idSource}"`);
                    const storageSource = collection == 'users' ? context.protectedStorage : context.storage;
                    responseData = Array.isArray(responseData) ? responseData.map(transform) : transform(responseData);

                    function transform(r) {
                        const seekId = r[idSource];
                        const related = storageSource.get(collection, seekId);
                        delete related.hashedPassword;
                        r[propName] = related;
                        return r;
                    }
                });
            }

        } catch (err) {
            console.error(err);
            if (err.message.includes('does not exist')) {
                throw new NotFoundError$1();
            } else {
                throw new RequestError$1(err.message);
            }
        }

        context.canAccess(responseData);

        return responseData;
    }

    function post(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length > 0) {
            throw new RequestError$1('Use PUT to update records');
        }
        context.canAccess(undefined, body);

        body._ownerId = context.user._id;
        let responseData;

        try {
            responseData = context.storage.add(context.params.collection, body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function put(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.set(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function patch(context, tokens, query, body) {
        console.log('Request body:\n', body);

        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing, body);

        try {
            responseData = context.storage.merge(context.params.collection, tokens[0], body);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    function del(context, tokens, query, body) {
        validateRequest(context, tokens);
        if (tokens.length != 1) {
            throw new RequestError$1('Missing entry ID');
        }

        let responseData;
        let existing;

        try {
            existing = context.storage.get(context.params.collection, tokens[0]);
        } catch (err) {
            throw new NotFoundError$1();
        }

        context.canAccess(existing);

        try {
            responseData = context.storage.delete(context.params.collection, tokens[0]);
        } catch (err) {
            throw new RequestError$1();
        }

        return responseData;
    }

    /*
     * This service requires storage and auth plugins
     */

    const dataService$1 = new Service_1();
    dataService$1.get(':collection', crud.get);
    dataService$1.post(':collection', crud.post);
    dataService$1.put(':collection', crud.put);
    dataService$1.patch(':collection', crud.patch);
    dataService$1.delete(':collection', crud.delete);

    var data$1 = dataService$1.parseRequest;

    const imgdata = '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Td4DLneAwSddMiRH8tMU8nng/Yy+KQsM3AKBNbe35j5OH4A0dbV8AxwcAqMFyl73eHd3e2//nmn29wOGi3Kv+RixSgAAEkxpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+Cjx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDQuNC4wLUV4aXYyIj4KIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgIHhtbG5zOmlwdGNFeHQ9Imh0dHA6Ly9pcHRjLm9yZy9zdGQvSXB0YzR4bXBFeHQvMjAwOC0wMi0yOS8iCiAgICB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIKICAgIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiCiAgICB4bWxuczpwbHVzPSJodHRwOi8vbnMudXNlcGx1cy5vcmcvbGRmL3htcC8xLjAvIgogICAgeG1sbnM6R0lNUD0iaHR0cDovL3d3dy5naW1wLm9yZy94bXAvIgogICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIgogICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIgogICAgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIKICAgeG1wTU06RG9jdW1lbnRJRD0iZ2ltcDpkb2NpZDpnaW1wOjdjZDM3NWM3LTcwNmItNDlkMy1hOWRkLWNmM2Q3MmMwY2I4ZCIKICAgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2NGY2YTJlYy04ZjA5LTRkZTMtOTY3ZC05MTUyY2U5NjYxNTAiCiAgIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDoxMmE1NzI5Mi1kNmJkLTRlYjQtOGUxNi1hODEzYjMwZjU0NWYiCiAgIEdJTVA6QVBJPSIyLjAiCiAgIEdJTVA6UGxhdGZvcm09IldpbmRvd3MiCiAgIEdJTVA6VGltZVN0YW1wPSIxNjEzMzAwNzI5NTMwNjQzIgogICBHSU1QOlZlcnNpb249IjIuMTAuMTIiCiAgIGRjOkZvcm1hdD0iaW1hZ2UvcG5nIgogICBwaG90b3Nob3A6Q3JlZGl0PSJHZXR0eSBJbWFnZXMvaVN0b2NrcGhvdG8iCiAgIHhtcDpDcmVhdG9yVG9vbD0iR0lNUCAyLjEwIgogICB4bXBSaWdodHM6V2ViU3RhdGVtZW50PSJodHRwczovL3d3dy5pc3RvY2twaG90by5jb20vbGVnYWwvbGljZW5zZS1hZ3JlZW1lbnQ/dXRtX21lZGl1bT1vcmdhbmljJmFtcDt1dG1fc291cmNlPWdvb2dsZSZhbXA7dXRtX2NhbXBhaWduPWlwdGN1cmwiPgogICA8aXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvbkNyZWF0ZWQ+CiAgIDxpcHRjRXh0OkxvY2F0aW9uU2hvd24+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpMb2NhdGlvblNob3duPgogICA8aXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpBcnR3b3JrT3JPYmplY3Q+CiAgIDxpcHRjRXh0OlJlZ2lzdHJ5SWQ+CiAgICA8cmRmOkJhZy8+CiAgIDwvaXB0Y0V4dDpSZWdpc3RyeUlkPgogICA8eG1wTU06SGlzdG9yeT4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgc3RFdnQ6YWN0aW9uPSJzYXZlZCIKICAgICAgc3RFdnQ6Y2hhbmdlZD0iLyIKICAgICAgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjOTQ2M2MxMC05OWE4LTQ1NDQtYmRlOS1mNzY0ZjdhODJlZDkiCiAgICAgIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkdpbXAgMi4xMCAoV2luZG93cykiCiAgICAgIHN0RXZ0OndoZW49IjIwMjEtMDItMTRUMTM6MDU6MjkiLz4KICAgIDwvcmRmOlNlcT4KICAgPC94bXBNTTpIaXN0b3J5PgogICA8cGx1czpJbWFnZVN1cHBsaWVyPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VTdXBwbGllcj4KICAgPHBsdXM6SW1hZ2VDcmVhdG9yPgogICAgPHJkZjpTZXEvPgogICA8L3BsdXM6SW1hZ2VDcmVhdG9yPgogICA8cGx1czpDb3B5cmlnaHRPd25lcj4KICAgIDxyZGY6U2VxLz4KICAgPC9wbHVzOkNvcHlyaWdodE93bmVyPgogICA8cGx1czpMaWNlbnNvcj4KICAgIDxyZGY6U2VxPgogICAgIDxyZGY6bGkKICAgICAgcGx1czpMaWNlbnNvclVSTD0iaHR0cHM6Ly93d3cuaXN0b2NrcGhvdG8uY29tL3Bob3RvL2xpY2Vuc2UtZ20xMTUwMzQ1MzQxLT91dG1fbWVkaXVtPW9yZ2FuaWMmYW1wO3V0bV9zb3VyY2U9Z29vZ2xlJmFtcDt1dG1fY2FtcGFpZ249aXB0Y3VybCIvPgogICAgPC9yZGY6U2VxPgogICA8L3BsdXM6TGljZW5zb3I+CiAgIDxkYzpjcmVhdG9yPgogICAgPHJkZjpTZXE+CiAgICAgPHJkZjpsaT5WbGFkeXNsYXYgU2VyZWRhPC9yZGY6bGk+CiAgICA8L3JkZjpTZXE+CiAgIDwvZGM6Y3JlYXRvcj4KICAgPGRjOmRlc2NyaXB0aW9uPgogICAgPHJkZjpBbHQ+CiAgICAgPHJkZjpsaSB4bWw6bGFuZz0ieC1kZWZhdWx0Ij5TZXJ2aWNlIHRvb2xzIGljb24gb24gd2hpdGUgYmFja2dyb3VuZC4gVmVjdG9yIGlsbHVzdHJhdGlvbi48L3JkZjpsaT4KICAgIDwvcmRmOkFsdD4KICAgPC9kYzpkZXNjcmlwdGlvbj4KICA8L3JkZjpEZXNjcmlwdGlvbj4KIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIAogICAgICAgICAgICAgICAgICAgICAgICAgICAKPD94cGFja2V0IGVuZD0idyI/PmWJCnkAAAAGYktHRAD/AP8A/6C9p5MAAAAJcEhZcwAALiMAAC4jAXilP3YAAAAHdElNRQflAg4LBR0CZnO/AAAARHRFWHRDb21tZW50AFNlcnZpY2UgdG9vbHMgaWNvbiBvbiB3aGl0ZSBiYWNrZ3JvdW5kLiBWZWN0b3IgaWxsdXN0cmF0aW9uLlwvEeIAAAMxSURBVHja7Z1bcuQwCEX7qrLQXlp2ynxNVWbK7dgWj3sl9JvYRhxACD369erW7UMzx/cYaychonAQvXM5ABYkpynoYIiEGdoQog6AYfywBrCxF4zNrX/7McBbuXJe8rXx/KBDULcGsMREzCbeZ4J6ME/9wVH5d95rogZp3npEgPLP3m2iUSGqXBJS5Dr6hmLm8kRuZABYti5TMaailV8LodNQwTTUWk4/WZk75l0kM0aZQdaZjMqkrQDAuyMVJWFjMB4GANXr0lbZBxQKr7IjI7QvVWkok/Jn5UHVh61CYPs+/i7eL9j3y/Au8WqoAIC34k8/9k7N8miLcaGWHwgjZXE/awyYX7h41wKMCskZM2HXAddDkTdglpSjz5bcKPbcCEKwT3+DhxtVpJvkEC7rZSgq32NMSBoXaCdiahDCKrND0fpX8oQlVsQ8IFQZ1VARdIF5wroekAjB07gsAgDUIbQHFENIDEX4CQANIVe8Iw/ASiACLXl28eaf579OPuBa9/mrELUYHQ1t3KHlZZnRcXb2/c7ygXIQZqjDMEzeSrOgCAhqYMvTUE+FKXoVxTxgk3DEPREjGzj3nAk/VaKyB9GVIu4oMyOlrQZgrBBEFG9PAZTfs3amYDGrP9Wl964IeFvtz9JFluIvlEvcdoXDOdxggbDxGwTXcxFRi/LdirKgZUBm7SUdJG69IwSUzAMWgOAq/4hyrZVaJISSNWHFVbEoCFEhyBrCtXS9L+so9oTy8wGqxbQDD350WTjNESVFEB5hdKzUGcV5QtYxVWR2Ssl4Mg9qI9u6FCBInJRXgfEEgtS9Cgrg7kKouq4mdcDNBnEHQvWFTdgdgsqP+MiluVeBM13ahx09AYSWi50gsF+I6vn7BmCEoHR3NBzkpIOw4+XdVBBGQUioblaZHbGlodtB+N/jxqwLX/x/NARfD8ADxTOCKIcwE4Lw0OIbguMYcGTlymEpHYLXIKx8zQEqIfS2lGJPaADFEBR/PMH79ErqtpnZmTBlvM4wgihPWDEEhXn1LISj50crNgfCp+dWHYQRCfb2zgfnBZmKGAyi914anK9Coi4LOMhoAn3uVtn+AGnLKxPUZnCuAAAAAElFTkSuQmCC';
    const img = Buffer.from(imgdata, 'base64');

    var favicon = (method, tokens, query, body) => {
        console.log('serving favicon...');
        const headers = {
            'Content-Type': 'image/png',
            'Content-Length': img.length
        };
        let result = img;

        return {
            headers,
            result
        };
    };

    var require$$0 = "<!DOCTYPE html>\r\n<html lang=\"en\">\r\n<head>\r\n    <meta charset=\"UTF-8\">\r\n    <meta http-equiv=\"X-UA-Compatible\" content=\"IE=edge\">\r\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\r\n    <title>SUPS Admin Panel</title>\r\n    <style>\r\n        * {\r\n            padding: 0;\r\n            margin: 0;\r\n        }\r\n\r\n        body {\r\n            padding: 32px;\r\n            font-size: 16px;\r\n        }\r\n\r\n        .layout::after {\r\n            content: '';\r\n            clear: both;\r\n            display: table;\r\n        }\r\n\r\n        .col {\r\n            display: block;\r\n            float: left;\r\n        }\r\n\r\n        p {\r\n            padding: 8px 16px;\r\n        }\r\n\r\n        table {\r\n            border-collapse: collapse;\r\n        }\r\n\r\n        caption {\r\n            font-size: 120%;\r\n            text-align: left;\r\n            padding: 4px 8px;\r\n            font-weight: bold;\r\n            background-color: #ddd;\r\n        }\r\n\r\n        table, tr, th, td {\r\n            border: 1px solid #ddd;\r\n        }\r\n\r\n        th, td {\r\n            padding: 4px 8px;\r\n        }\r\n\r\n        ul {\r\n            list-style: none;\r\n        }\r\n\r\n        .collection-list a {\r\n            display: block;\r\n            width: 120px;\r\n            padding: 4px 8px;\r\n            text-decoration: none;\r\n            color: black;\r\n            background-color: #ccc;\r\n        }\r\n        .collection-list a:hover {\r\n            background-color: #ddd;\r\n        }\r\n        .collection-list a:visited {\r\n            color: black;\r\n        }\r\n    </style>\r\n    <script type=\"module\">\nimport { html, render } from 'https://unpkg.com/lit-html@1.3.0?module';\nimport { until } from 'https://unpkg.com/lit-html@1.3.0/directives/until?module';\n\nconst api = {\r\n    async get(url) {\r\n        return json(url);\r\n    },\r\n    async post(url, body) {\r\n        return json(url, {\r\n            method: 'POST',\r\n            headers: { 'Content-Type': 'application/json' },\r\n            body: JSON.stringify(body)\r\n        });\r\n    }\r\n};\r\n\r\nasync function json(url, options) {\r\n    return await (await fetch('/' + url, options)).json();\r\n}\r\n\r\nasync function getCollections() {\r\n    return api.get('data');\r\n}\r\n\r\nasync function getRecords(collection) {\r\n    return api.get('data/' + collection);\r\n}\r\n\r\nasync function getThrottling() {\r\n    return api.get('util/throttle');\r\n}\r\n\r\nasync function setThrottling(throttle) {\r\n    return api.post('util', { throttle });\r\n}\n\nasync function collectionList(onSelect) {\r\n    const collections = await getCollections();\r\n\r\n    return html`\r\n    <ul class=\"collection-list\">\r\n        ${collections.map(collectionLi)}\r\n    </ul>`;\r\n\r\n    function collectionLi(name) {\r\n        return html`<li><a href=\"javascript:void(0)\" @click=${(ev) => onSelect(ev, name)}>${name}</a></li>`;\r\n    }\r\n}\n\nasync function recordTable(collectionName) {\r\n    const records = await getRecords(collectionName);\r\n    const layout = getLayout(records);\r\n\r\n    return html`\r\n    <table>\r\n        <caption>${collectionName}</caption>\r\n        <thead>\r\n            <tr>${layout.map(f => html`<th>${f}</th>`)}</tr>\r\n        </thead>\r\n        <tbody>\r\n            ${records.map(r => recordRow(r, layout))}\r\n        </tbody>\r\n    </table>`;\r\n}\r\n\r\nfunction getLayout(records) {\r\n    const result = new Set(['_id']);\r\n    records.forEach(r => Object.keys(r).forEach(k => result.add(k)));\r\n\r\n    return [...result.keys()];\r\n}\r\n\r\nfunction recordRow(record, layout) {\r\n    return html`\r\n    <tr>\r\n        ${layout.map(f => html`<td>${JSON.stringify(record[f]) || html`<span>(missing)</span>`}</td>`)}\r\n    </tr>`;\r\n}\n\nasync function throttlePanel(display) {\r\n    const active = await getThrottling();\r\n\r\n    return html`\r\n    <p>\r\n        Request throttling: </span>${active}</span>\r\n        <button @click=${(ev) => set(ev, true)}>Enable</button>\r\n        <button @click=${(ev) => set(ev, false)}>Disable</button>\r\n    </p>`;\r\n\r\n    async function set(ev, state) {\r\n        ev.target.disabled = true;\r\n        await setThrottling(state);\r\n        display();\r\n    }\r\n}\n\n//import page from '//unpkg.com/page/page.mjs';\r\n\r\n\r\nfunction start() {\r\n    const main = document.querySelector('main');\r\n    editor(main);\r\n}\r\n\r\nasync function editor(main) {\r\n    let list = html`<div class=\"col\">Loading&hellip;</div>`;\r\n    let viewer = html`<div class=\"col\">\r\n    <p>Select collection to view records</p>\r\n</div>`;\r\n    display();\r\n\r\n    list = html`<div class=\"col\">${await collectionList(onSelect)}</div>`;\r\n    display();\r\n\r\n    async function display() {\r\n        render(html`\r\n        <section class=\"layout\">\r\n            ${until(throttlePanel(display), html`<p>Loading</p>`)}\r\n        </section>\r\n        <section class=\"layout\">\r\n            ${list}\r\n            ${viewer}\r\n        </section>`, main);\r\n    }\r\n\r\n    async function onSelect(ev, name) {\r\n        ev.preventDefault();\r\n        viewer = html`<div class=\"col\">${await recordTable(name)}</div>`;\r\n        display();\r\n    }\r\n}\r\n\r\nstart();\n\n</script>\r\n</head>\r\n<body>\r\n    <main>\r\n        Loading&hellip;\r\n    </main>\r\n</body>\r\n</html>";

    const mode = process.argv[2] == '-dev' ? 'dev' : 'prod';

    const files = {
        index: mode == 'prod' ? require$$0 : fs__default['default'].readFileSync('./client/index.html', 'utf-8')
    };

    var admin = (method, tokens, query, body) => {
        const headers = {
            'Content-Type': 'text/html'
        };
        let result = '';

        const resource = tokens.join('/');
        if (resource && resource.split('.').pop() == 'js') {
            headers['Content-Type'] = 'application/javascript';

            files[resource] = files[resource] || fs__default['default'].readFileSync('./client/' + resource, 'utf-8');
            result = files[resource];
        } else {
            result = files.index;
        }

        return {
            headers,
            result
        };
    };

    /*
     * This service requires util plugin
     */

    const utilService = new Service_1();

    utilService.post('*', onRequest);
    utilService.get(':service', getStatus);

    function getStatus(context, tokens, query, body) {
        return context.util[context.params.service];
    }

    function onRequest(context, tokens, query, body) {
        Object.entries(body).forEach(([k,v]) => {
            console.log(`${k} ${v ? 'enabled' : 'disabled'}`);
            context.util[k] = v;
        });
        return '';
    }

    var util$1 = utilService.parseRequest;

    var services = {
        jsonstore,
        users,
        data: data$1,
        favicon,
        admin,
        util: util$1
    };

    const { uuid: uuid$2 } = util;


    function initPlugin(settings) {
        const storage = createInstance(settings.seedData);
        const protectedStorage = createInstance(settings.protectedData);

        return function decoreateContext(context, request) {
            context.storage = storage;
            context.protectedStorage = protectedStorage;
        };
    }


    /**
     * Create storage instance and populate with seed data
     * @param {Object=} seedData Associative array with data. Each property is an object with properties in format {key: value}
     */
    function createInstance(seedData = {}) {
        const collections = new Map();

        // Initialize seed data from file    
        for (let collectionName in seedData) {
            if (seedData.hasOwnProperty(collectionName)) {
                const collection = new Map();
                for (let recordId in seedData[collectionName]) {
                    if (seedData.hasOwnProperty(collectionName)) {
                        collection.set(recordId, seedData[collectionName][recordId]);
                    }
                }
                collections.set(collectionName, collection);
            }
        }


        // Manipulation

        /**
         * Get entry by ID or list of all entries from collection or list of all collections
         * @param {string=} collection Name of collection to access. Throws error if not found. If omitted, returns list of all collections.
         * @param {number|string=} id ID of requested entry. Throws error if not found. If omitted, returns of list all entries in collection.
         * @return {Object} Matching entry.
         */
        function get(collection, id) {
            if (!collection) {
                return [...collections.keys()];
            }
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!id) {
                const entries = [...targetCollection.entries()];
                let result = entries.map(([k, v]) => {
                    return Object.assign(deepCopy(v), { _id: k });
                });
                return result;
            }
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            const entry = targetCollection.get(id);
            return Object.assign(deepCopy(entry), { _id: id });
        }

        /**
         * Add new entry to collection. ID will be auto-generated
         * @param {string} collection Name of collection to access. If the collection does not exist, it will be created.
         * @param {Object} data Value to store.
         * @return {Object} Original value with resulting ID under _id property.
         */
        function add(collection, data) {
            const record = assignClean({ _ownerId: data._ownerId }, data);

            let targetCollection = collections.get(collection);
            if (!targetCollection) {
                targetCollection = new Map();
                collections.set(collection, targetCollection);
            }
            let id = uuid$2();
            // Make sure new ID does not match existing value
            while (targetCollection.has(id)) {
                id = uuid$2();
            }

            record._createdOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Replace entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Record will be replaced!
         * @return {Object} Updated entry.
         */
        function set(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = targetCollection.get(id);
            const record = assignSystemProps(deepCopy(data), existing);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Modify entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @param {Object} data Value to store. Shallow merge will be performed!
         * @return {Object} Updated entry.
         */
         function merge(collection, id, data) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }

            const existing = deepCopy(targetCollection.get(id));
            const record = assignClean(existing, data);
            record._updatedOn = Date.now();
            targetCollection.set(id, record);
            return Object.assign(deepCopy(record), { _id: id });
        }

        /**
         * Delete entry by ID
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {number|string} id ID of entry to update. Throws error if not found.
         * @return {{_deletedOn: number}} Server time of deletion.
         */
        function del(collection, id) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            if (!targetCollection.has(id)) {
                throw new ReferenceError('Entry does not exist: ' + id);
            }
            targetCollection.delete(id);

            return { _deletedOn: Date.now() };
        }

        /**
         * Search in collection by query object
         * @param {string} collection Name of collection to access. Throws error if not found.
         * @param {Object} query Query object. Format {prop: value}.
         * @return {Object[]} Array of matching entries.
         */
        function query(collection, query) {
            if (!collections.has(collection)) {
                throw new ReferenceError('Collection does not exist: ' + collection);
            }
            const targetCollection = collections.get(collection);
            const result = [];
            // Iterate entries of target collection and compare each property with the given query
            for (let [key, entry] of [...targetCollection.entries()]) {
                let match = true;
                for (let prop in entry) {
                    if (query.hasOwnProperty(prop)) {
                        const targetValue = query[prop];
                        // Perform lowercase search, if value is string
                        if (typeof targetValue === 'string' && typeof entry[prop] === 'string') {
                            if (targetValue.toLocaleLowerCase() !== entry[prop].toLocaleLowerCase()) {
                                match = false;
                                break;
                            }
                        } else if (targetValue != entry[prop]) {
                            match = false;
                            break;
                        }
                    }
                }

                if (match) {
                    result.push(Object.assign(deepCopy(entry), { _id: key }));
                }
            }

            return result;
        }

        return { get, add, set, merge, delete: del, query };
    }


    function assignSystemProps(target, entry, ...rest) {
        const whitelist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let prop of whitelist) {
            if (entry.hasOwnProperty(prop)) {
                target[prop] = deepCopy(entry[prop]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }


    function assignClean(target, entry, ...rest) {
        const blacklist = [
            '_id',
            '_createdOn',
            '_updatedOn',
            '_ownerId'
        ];
        for (let key in entry) {
            if (blacklist.includes(key) == false) {
                target[key] = deepCopy(entry[key]);
            }
        }
        if (rest.length > 0) {
            Object.assign(target, ...rest);
        }

        return target;
    }

    function deepCopy(value) {
        if (Array.isArray(value)) {
            return value.map(deepCopy);
        } else if (typeof value == 'object') {
            return [...Object.entries(value)].reduce((p, [k, v]) => Object.assign(p, { [k]: deepCopy(v) }), {});
        } else {
            return value;
        }
    }

    var storage = initPlugin;

    const { ConflictError: ConflictError$1, CredentialError: CredentialError$1, RequestError: RequestError$2 } = errors;

    function initPlugin$1(settings) {
        const identity = settings.identity;

        return function decorateContext(context, request) {
            context.auth = {
                register,
                login,
                logout
            };

            const userToken = request.headers['x-authorization'];
            if (userToken !== undefined) {
                let user;
                const session = findSessionByToken(userToken);
                if (session !== undefined) {
                    const userData = context.protectedStorage.get('users', session.userId);
                    if (userData !== undefined) {
                        console.log('Authorized as ' + userData[identity]);
                        user = userData;
                    }
                }
                if (user !== undefined) {
                    context.user = user;
                } else {
                    throw new CredentialError$1('Invalid access token');
                }
            }

            function register(body) {
                if (body.hasOwnProperty(identity) === false ||
                    body.hasOwnProperty('password') === false ||
                    body[identity].length == 0 ||
                    body.password.length == 0) {
                    throw new RequestError$2('Missing fields');
                } else if (context.protectedStorage.query('users', { [identity]: body[identity] }).length !== 0) {
                    throw new ConflictError$1(`A user with the same ${identity} already exists`);
                } else {
                    const newUser = Object.assign({}, body, {
                        [identity]: body[identity],
                        hashedPassword: hash(body.password)
                    });
                    const result = context.protectedStorage.add('users', newUser);
                    delete result.hashedPassword;

                    const session = saveSession(result._id);
                    result.accessToken = session.accessToken;

                    return result;
                }
            }

            function login(body) {
                const targetUser = context.protectedStorage.query('users', { [identity]: body[identity] });
                if (targetUser.length == 1) {
                    if (hash(body.password) === targetUser[0].hashedPassword) {
                        const result = targetUser[0];
                        delete result.hashedPassword;

                        const session = saveSession(result._id);
                        result.accessToken = session.accessToken;

                        return result;
                    } else {
                        throw new CredentialError$1('Login or password don\'t match');
                    }
                } else {
                    throw new CredentialError$1('Login or password don\'t match');
                }
            }

            function logout() {
                if (context.user !== undefined) {
                    const session = findSessionByUserId(context.user._id);
                    if (session !== undefined) {
                        context.protectedStorage.delete('sessions', session._id);
                    }
                } else {
                    throw new CredentialError$1('User session does not exist');
                }
            }

            function saveSession(userId) {
                let session = context.protectedStorage.add('sessions', { userId });
                const accessToken = hash(session._id);
                session = context.protectedStorage.set('sessions', session._id, Object.assign({ accessToken }, session));
                return session;
            }

            function findSessionByToken(userToken) {
                return context.protectedStorage.query('sessions', { accessToken: userToken })[0];
            }

            function findSessionByUserId(userId) {
                return context.protectedStorage.query('sessions', { userId })[0];
            }
        };
    }


    const secret = 'This is not a production server';

    function hash(string) {
        const hash = crypto__default['default'].createHmac('sha256', secret);
        hash.update(string);
        return hash.digest('hex');
    }

    var auth = initPlugin$1;

    function initPlugin$2(settings) {
        const util = {
            throttle: false
        };

        return function decoreateContext(context, request) {
            context.util = util;
        };
    }

    var util$2 = initPlugin$2;

    /*
     * This plugin requires auth and storage plugins
     */

    const { RequestError: RequestError$3, ConflictError: ConflictError$2, CredentialError: CredentialError$2, AuthorizationError: AuthorizationError$2 } = errors;

    function initPlugin$3(settings) {
        const actions = {
            'GET': '.read',
            'POST': '.create',
            'PUT': '.update',
            'PATCH': '.update',
            'DELETE': '.delete'
        };
        const rules = Object.assign({
            '*': {
                '.create': ['User'],
                '.update': ['Owner'],
                '.delete': ['Owner']
            }
        }, settings.rules);

        return function decorateContext(context, request) {
            // special rules (evaluated at run-time)
            const get = (collectionName, id) => {
                return context.storage.get(collectionName, id);
            };
            const isOwner = (user, object) => {
                return user._id == object._ownerId;
            };
            context.rules = {
                get,
                isOwner
            };
            const isAdmin = request.headers.hasOwnProperty('x-admin');

            context.canAccess = canAccess;

            function canAccess(data, newData) {
                const user = context.user;
                const action = actions[request.method];
                let { rule, propRules } = getRule(action, context.params.collection, data);

                if (Array.isArray(rule)) {
                    rule = checkRoles(rule, data);
                } else if (typeof rule == 'string') {
                    rule = !!(eval(rule));
                }
                if (!rule && !isAdmin) {
                    throw new CredentialError$2();
                }
                propRules.map(r => applyPropRule(action, r, user, data, newData));
            }

            function applyPropRule(action, [prop, rule], user, data, newData) {
                // NOTE: user needs to be in scope for eval to work on certain rules
                if (typeof rule == 'string') {
                    rule = !!eval(rule);
                }

                if (rule == false) {
                    if (action == '.create' || action == '.update') {
                        delete newData[prop];
                    } else if (action == '.read') {
                        delete data[prop];
                    }
                }
            }

            function checkRoles(roles, data, newData) {
                if (roles.includes('Guest')) {
                    return true;
                } else if (!context.user && !isAdmin) {
                    throw new AuthorizationError$2();
                } else if (roles.includes('User')) {
                    return true;
                } else if (context.user && roles.includes('Owner')) {
                    return context.user._id == data._ownerId;
                } else {
                    return false;
                }
            }
        };



        function getRule(action, collection, data = {}) {
            let currentRule = ruleOrDefault(true, rules['*'][action]);
            let propRules = [];

            // Top-level rules for the collection
            const collectionRules = rules[collection];
            if (collectionRules !== undefined) {
                // Top-level rule for the specific action for the collection
                currentRule = ruleOrDefault(currentRule, collectionRules[action]);

                // Prop rules
                const allPropRules = collectionRules['*'];
                if (allPropRules !== undefined) {
                    propRules = ruleOrDefault(propRules, getPropRule(allPropRules, action));
                }

                // Rules by record id 
                const recordRules = collectionRules[data._id];
                if (recordRules !== undefined) {
                    currentRule = ruleOrDefault(currentRule, recordRules[action]);
                    propRules = ruleOrDefault(propRules, getPropRule(recordRules, action));
                }
            }

            return {
                rule: currentRule,
                propRules
            };
        }

        function ruleOrDefault(current, rule) {
            return (rule === undefined || rule.length === 0) ? current : rule;
        }

        function getPropRule(record, action) {
            const props = Object
                .entries(record)
                .filter(([k]) => k[0] != '.')
                .filter(([k, v]) => v.hasOwnProperty(action))
                .map(([k, v]) => [k, v[action]]);

            return props;
        }
    }

    var rules = initPlugin$3;

    var identity = "email";
    var protectedData = {
    	users: {
    		"35c62d76-8152-4626-8712-eeb96381bea8": {
    			email: "peter@abv.bg",
    			username: "Peter",
    			hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
    		},
    		"847ec027-f659-4086-8032-5173e2f9c93a": {
    			email: "george@abv.bg",
    			username: "George",
    			hashedPassword: "83313014ed3e2391aa1332615d2f053cf5c1bfe05ca1cbcb5582443822df6eb1"
    		},
    		"60f0cf0b-34b0-4abd-9769-8c42f830dffc": {
    			email: "admin@abv.bg",
    			username: "Admin",
    			hashedPassword: "fac7060c3e17e6f151f247eacb2cd5ae80b8c36aedb8764e18a41bbdc16aa302"
    		}
    	},
    	sessions: {
    	}
    };
    var seedData = {
    	recipes: {
    		"3987279d-0ad4-4afb-8ca9-5b256ae3b298": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			name: "Easy Lasagna",
    			img: "assets/lasagna.jpg",
    			ingredients: [
    				"1 tbsp Ingredient 1",
    				"2 cups Ingredient 2",
    				"500 g  Ingredient 3",
    				"25 g Ingredient 4"
    			],
    			steps: [
    				"Prepare ingredients",
    				"Mix ingredients",
    				"Cook until done"
    			],
    			_createdOn: 1613551279012
    		},
    		"8f414b4f-ab39-4d36-bedb-2ad69da9c830": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			name: "Grilled Duck Fillet",
    			img: "assets/roast.jpg",
    			ingredients: [
    				"500 g  Ingredient 1",
    				"3 tbsp Ingredient 2",
    				"2 cups Ingredient 3"
    			],
    			steps: [
    				"Prepare ingredients",
    				"Mix ingredients",
    				"Cook until done"
    			],
    			_createdOn: 1613551344360
    		},
    		"985d9eab-ad2e-4622-a5c8-116261fb1fd2": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			name: "Roast Trout",
    			img: "assets/fish.jpg",
    			ingredients: [
    				"4 cups Ingredient 1",
    				"1 tbsp Ingredient 2",
    				"1 tbsp Ingredient 3",
    				"750 g  Ingredient 4",
    				"25 g Ingredient 5"
    			],
    			steps: [
    				"Prepare ingredients",
    				"Mix ingredients",
    				"Cook until done"
    			],
    			_createdOn: 1613551388703
    		}
    	},
    	comments: {
    		"0a272c58-b7ea-4e09-a000-7ec988248f66": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			content: "Great recipe!",
    			recipeId: "8f414b4f-ab39-4d36-bedb-2ad69da9c830",
    			_createdOn: 1614260681375,
    			_id: "0a272c58-b7ea-4e09-a000-7ec988248f66"
    		}
    	},
    	records: {
    		i01: {
    			name: "John1",
    			val: 1,
    			_createdOn: 1613551388703
    		},
    		i02: {
    			name: "John2",
    			val: 1,
    			_createdOn: 1613551388713
    		},
    		i03: {
    			name: "John3",
    			val: 2,
    			_createdOn: 1613551388723
    		},
    		i04: {
    			name: "John4",
    			val: 2,
    			_createdOn: 1613551388733
    		},
    		i05: {
    			name: "John5",
    			val: 2,
    			_createdOn: 1613551388743
    		},
    		i06: {
    			name: "John6",
    			val: 3,
    			_createdOn: 1613551388753
    		},
    		i07: {
    			name: "John7",
    			val: 3,
    			_createdOn: 1613551388763
    		},
    		i08: {
    			name: "John8",
    			val: 2,
    			_createdOn: 1613551388773
    		},
    		i09: {
    			name: "John9",
    			val: 3,
    			_createdOn: 1613551388783
    		},
    		i10: {
    			name: "John10",
    			val: 1,
    			_createdOn: 1613551388793
    		}
    	},
    	catches: {
    		"07f260f4-466c-4607-9a33-f7273b24f1b4": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			angler: "Paulo Admorim",
    			weight: 636,
    			species: "Atlantic Blue Marlin",
    			location: "Vitoria, Brazil",
    			bait: "trolled pink",
    			captureTime: 80,
    			_createdOn: 1614760714812,
    			_id: "07f260f4-466c-4607-9a33-f7273b24f1b4"
    		},
    		"bdabf5e9-23be-40a1-9f14-9117b6702a9d": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			angler: "John Does",
    			weight: 554,
    			species: "Atlantic Blue Marlin",
    			location: "Buenos Aires, Argentina",
    			bait: "trolled pink",
    			captureTime: 120,
    			_createdOn: 1614760782277,
    			_id: "bdabf5e9-23be-40a1-9f14-9117b6702a9d"
    		}
    	},
    	furniture: {
    	},
    	orders: {
    	},
    	movies: {
    		"1240549d-f0e0-497e-ab99-eb8f703713d7": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			title: "Black Widow",
    			description: "Natasha Romanoff aka Black Widow confronts the darker parts of her ledger when a dangerous conspiracy with ties to her past arises. Comes on the screens 2020.",
    			img: "https://miro.medium.com/max/735/1*akkAa2CcbKqHsvqVusF3-w.jpeg",
    			_createdOn: 1614935055353,
    			_id: "1240549d-f0e0-497e-ab99-eb8f703713d7"
    		},
    		"143e5265-333e-4150-80e4-16b61de31aa0": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			title: "Wonder Woman 1984",
    			description: "Diana must contend with a work colleague and businessman, whose desire for extreme wealth sends the world down a path of destruction, after an ancient artifact that grants wishes goes missing.",
    			img: "https://pbs.twimg.com/media/ETINgKwWAAAyA4r.jpg",
    			_createdOn: 1614935181470,
    			_id: "143e5265-333e-4150-80e4-16b61de31aa0"
    		},
    		"a9bae6d8-793e-46c4-a9db-deb9e3484909": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			title: "Top Gun 2",
    			description: "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
    			img: "https://i.pinimg.com/originals/f2/a4/58/f2a458048757bc6914d559c9e4dc962a.jpg",
    			_createdOn: 1614935268135,
    			_id: "a9bae6d8-793e-46c4-a9db-deb9e3484909"
    		}
    	},
    	likes: {
    	},
    	ideas: {
    		"833e0e57-71dc-42c0-b387-0ce0caf5225e": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			title: "Best Pilates Workout To Do At Home",
    			description: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Minima possimus eveniet ullam aspernatur corporis tempore quia nesciunt nostrum mollitia consequatur. At ducimus amet aliquid magnam nulla sed totam blanditiis ullam atque facilis corrupti quidem nisi iusto saepe, consectetur culpa possimus quos? Repellendus, dicta pariatur! Delectus, placeat debitis error dignissimos nesciunt magni possimus quo nulla, fuga corporis maxime minus nihil doloremque aliquam quia recusandae harum. Molestias dolorum recusandae commodi velit cum sapiente placeat alias rerum illum repudiandae? Suscipit tempore dolore autem, neque debitis quisquam molestias officia hic nesciunt? Obcaecati optio fugit blanditiis, explicabo odio at dicta asperiores distinctio expedita dolor est aperiam earum! Molestias sequi aliquid molestiae, voluptatum doloremque saepe dignissimos quidem quas harum quo. Eum nemo voluptatem hic corrupti officiis eaque et temporibus error totam numquam sequi nostrum assumenda eius voluptatibus quia sed vel, rerum, excepturi maxime? Pariatur, provident hic? Soluta corrupti aspernatur exercitationem vitae accusantium ut ullam dolor quod!",
    			img: "./images/best-pilates-youtube-workouts-2__medium_4x3.jpg",
    			_createdOn: 1615033373504,
    			_id: "833e0e57-71dc-42c0-b387-0ce0caf5225e"
    		},
    		"247efaa7-8a3e-48a7-813f-b5bfdad0f46c": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			title: "4 Eady DIY Idea To Try!",
    			description: "Similique rem culpa nemo hic recusandae perspiciatis quidem, quia expedita, sapiente est itaque optio enim placeat voluptates sit, fugit dignissimos tenetur temporibus exercitationem in quis magni sunt vel. Corporis officiis ut sapiente exercitationem consectetur debitis suscipit laborum quo enim iusto, labore, quod quam libero aliquid accusantium! Voluptatum quos porro fugit soluta tempore praesentium ratione dolorum impedit sunt dolores quod labore laudantium beatae architecto perspiciatis natus cupiditate, iure quia aliquid, iusto modi esse!",
    			img: "./images/brightideacropped.jpg",
    			_createdOn: 1615033452480,
    			_id: "247efaa7-8a3e-48a7-813f-b5bfdad0f46c"
    		},
    		"b8608c22-dd57-4b24-948e-b358f536b958": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			title: "Dinner Recipe",
    			description: "Consectetur labore et corporis nihil, officiis tempora, hic ex commodi sit aspernatur ad minima? Voluptas nesciunt, blanditiis ex nulla incidunt facere tempora laborum ut aliquid beatae obcaecati quidem reprehenderit consequatur quis iure natus quia totam vel. Amet explicabo quidem repellat unde tempore et totam minima mollitia, adipisci vel autem, enim voluptatem quasi exercitationem dolor cum repudiandae dolores nostrum sit ullam atque dicta, tempora iusto eaque! Rerum debitis voluptate impedit corrupti quibusdam consequatur minima, earum asperiores soluta. A provident reiciendis voluptates et numquam totam eveniet! Dolorum corporis libero dicta laborum illum accusamus ullam?",
    			img: "./images/dinner.jpg",
    			_createdOn: 1615033491967,
    			_id: "b8608c22-dd57-4b24-948e-b358f536b958"
    		}
    	},
    	catalog: {
    		"53d4dbf5-7f41-47ba-b485-43eccb91cb95": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			make: "Table",
    			model: "Swedish",
    			year: 2015,
    			description: "Medium table",
    			price: 235,
    			img: "./images/table.png",
    			material: "Hardwood",
    			_createdOn: 1615545143015,
    			_id: "53d4dbf5-7f41-47ba-b485-43eccb91cb95"
    		},
    		"f5929b5c-bca4-4026-8e6e-c09e73908f77": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			make: "Sofa",
    			model: "ES-549-M",
    			year: 2018,
    			description: "Three-person sofa, blue",
    			price: 1200,
    			img: "./images/sofa.jpg",
    			material: "Frame - steel, plastic; Upholstery - fabric",
    			_createdOn: 1615545572296,
    			_id: "f5929b5c-bca4-4026-8e6e-c09e73908f77"
    		},
    		"c7f51805-242b-45ed-ae3e-80b68605141b": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			make: "Chair",
    			model: "Bright Dining Collection",
    			year: 2017,
    			description: "Dining chair",
    			price: 180,
    			img: "./images/chair.jpg",
    			material: "Wood laminate; leather",
    			_createdOn: 1615546332126,
    			_id: "c7f51805-242b-45ed-ae3e-80b68605141b"
    		}
    	},
    	teams: {
    		"34a1cab1-81f1-47e5-aec3-ab6c9810efe1": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			name: "Storm Troopers",
    			logoUrl: "/assets/atat.png",
    			description: "These ARE the droids we're looking for",
    			_createdOn: 1615737591748,
    			_id: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1"
    		},
    		"dc888b1a-400f-47f3-9619-07607966feb8": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			name: "Team Rocket",
    			logoUrl: "/assets/rocket.png",
    			description: "Gotta catch 'em all!",
    			_createdOn: 1615737655083,
    			_id: "dc888b1a-400f-47f3-9619-07607966feb8"
    		},
    		"733fa9a1-26b6-490d-b299-21f120b2f53a": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			name: "Minions",
    			logoUrl: "/assets/hydrant.png",
    			description: "Friendly neighbourhood jelly beans, helping evil-doers succeed.",
    			_createdOn: 1615737688036,
    			_id: "733fa9a1-26b6-490d-b299-21f120b2f53a"
    		}
    	},
    	members: {
    		"cc9b0a0f-655d-45d7-9857-0a61c6bb2c4d": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			teamId: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1",
    			status: "member",
    			_createdOn: 1616236790262,
    			_updatedOn: 1616236792930
    		},
    		"61a19986-3b86-4347-8ca4-8c074ed87591": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
    			status: "member",
    			_createdOn: 1616237188183,
    			_updatedOn: 1616237189016
    		},
    		"8a03aa56-7a82-4a6b-9821-91349fbc552f": {
    			_ownerId: "847ec027-f659-4086-8032-5173e2f9c93a",
    			teamId: "733fa9a1-26b6-490d-b299-21f120b2f53a",
    			status: "member",
    			_createdOn: 1616237193355,
    			_updatedOn: 1616237195145
    		},
    		"9be3ac7d-2c6e-4d74-b187-04105ab7e3d6": {
    			_ownerId: "35c62d76-8152-4626-8712-eeb96381bea8",
    			teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
    			status: "member",
    			_createdOn: 1616237231299,
    			_updatedOn: 1616237235713
    		},
    		"280b4a1a-d0f3-4639-aa54-6d9158365152": {
    			_ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
    			teamId: "dc888b1a-400f-47f3-9619-07607966feb8",
    			status: "member",
    			_createdOn: 1616237257265,
    			_updatedOn: 1616237278248
    		},
    		"e797fa57-bf0a-4749-8028-72dba715e5f8": {
    			_ownerId: "60f0cf0b-34b0-4abd-9769-8c42f830dffc",
    			teamId: "34a1cab1-81f1-47e5-aec3-ab6c9810efe1",
    			status: "member",
    			_createdOn: 1616237272948,
    			_updatedOn: 1616237293676
    		}
    	},
        softwares: {
            "d749a819-1e41-4c65-9ce2-7b429c4ebd0d": {
            "_id": "d749a819-1e41-4c65-9ce2-7b429c4ebd0d",
            "title": "Awesome Text Editor",
            "description": "A lightweight and powerful text editor for developers.",
            "version": "1.2.3",
            "downloadUrl": "https://example.com/downloads/text-editor",
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgu9KkguK0DV81IkwkHB1_7_rS7KtGw0Filw&s",
            "operatingSystem": "Windows, macOS, Linux",
            "category": "Development Tools",
            "size": "15 MB",
            "instructions": "Download the installer and follow the on-screen instructions to complete the installation.",
            "createdAt": "2023-04-01T14:00:00Z",
            "comments": {
                "b1396556-808f-464c-96c6-b95fe45547c8": {
                    "username": "Nikola",
                    "text": "This is a really cool text editor!",
                    "_id": "b1396556-808f-464c-96c6-b95fe45547c8"
                }
            }
        },
        "b647bfa6-3d24-4c2b-87dd-5bbf254f3c82": {
            "_id": "b647bfa6-3d24-4c2b-87dd-5bbf254f3c82",
            "title": "Super Photo Editor",
            "description": "A versatile photo editing software with numerous features.",
            "version": "2.5.0",
            "downloadUrl": "https://example.com/downloads/photo-editor",
            "imageUrl": "data:image/png;base64,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",
            "operatingSystem": "Windows, macOS",
            "category": "Multimedia",
            "size": "50 MB",
            "instructions": "Run the downloaded file and follow the setup wizard to install the software.",
            "createdAt": "2023-04-15T09:30:00Z"
        },
        "c3e1e2d5-52b4-4b1d-8a68-0f9bb53c7641": {
            "_id": "c3e1e2d5-52b4-4b1d-8a68-0f9bb53c7641",
            "title": "Project Management Tool",
            "description": "A comprehensive tool to manage projects and tasks efficiently.",
            "version": "3.1.4",
            "downloadUrl": "https://example.com/downloads/project-management",
            "imageUrl": "data:image/png;base64,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",
            "operatingSystem": "Windows, macOS, Linux",
            "category": "Productivity",
            "size": "75 MB",
            "instructions": "Download and run the installer, then follow the instructions to set up the software.",
            "createdAt": "2023-05-10T11:45:00Z"
        },
        "1b7a27e9-69a2-4b4b-9390-5c8372d4b546": {
            "_id": "1b7a27e9-69a2-4b4b-9390-5c8372d4b546",
            "title": "Music Composer",
            "description": "An advanced music composition software with a wide range of features.",
            "version": "4.2.1",
            "downloadUrl": "https://example.com/downloads/music-composer",
            "imageUrl": "data:image/jpeg;base64,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",
            "operatingSystem": "Windows, macOS",
            "category": "Music",
            "size": "120 MB",
            "instructions": "Download the installer, run it, and follow the on-screen instructions to install the software.",
            "createdAt": "2023-06-01T08:00:00Z"
        },
        "f3b4e3b2-4e85-4a2d-8c24-1d42a6a8d7c1": {
            "_id": "f3b4e3b2-4e85-4a2d-8c24-1d42a6a8d7c1",
            "title": "Video Converter Pro",
            "description": "A high-speed video converter supporting various formats.",
            "version": "5.0.0",
            "downloadUrl": "https://example.com/downloads/video-converter",
            "imageUrl": "data:image/png;base64,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",
            "operatingSystem": "Windows, macOS",
            "category": "Multimedia",
            "size": "85 MB",
            "instructions": "Download the setup file and follow the installation instructions to install the software.",
            "createdAt": "2023-07-01T12:30:00Z"
        },
        "a7d4b6c3-4d5f-4a0b-8a65-6d20a7c8e7d2": {
            "_id": "a7d4b6c3-4d5f-4a0b-8a65-6d20a7c8e7d2",
            "title": "Secure Password Manager",
            "description": "A secure and user-friendly password manager for all your needs.",
            "version": "1.8.2",
            "downloadUrl": "https://example.com/downloads/password-manager",
            "imageUrl": "data:image/png;base64,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",
            "operatingSystem": "Windows, macOS, Linux",
            "category": "Security",
            "size": "30 MB",
            "instructions": "Run the downloaded installer and follow the steps to install the password manager.",
            "createdAt": "2023-07-20T15:15:00Z"
        },
        "c9b6a9d4-7b1e-4c2b-9a32-9b5c8e3a7d3f": {
            "_id": "c9b6a9d4-7b1e-4c2b-9a32-9b5c8e3a7d3f",
            "title": "3D Modeling Software",
            "description": "A powerful 3D modeling software for creating detailed 3D models.",
            "version": "6.4.1",
            "downloadUrl": "https://example.com/downloads/3d-modeling",
            "imageUrl": "data:image/jpeg;base64,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",
            "operatingSystem": "Windows, macOS",
            "category": "Graphics & Design",
            "size": "200 MB",
            "instructions": "Download the installer, open it, and follow the on-screen instructions to complete the installation.",
            "createdAt": "2023-08-10T17:45:00Z"
    }
        }
    };
    var rules$1 = {
    	users: {
    		".create": false,
    		".read": [
    			"Owner"
    		],
    		".update": false,
    		".delete": false
    	},
    	members: {
    		".update": "isOwner(user, get('teams', data.teamId))",
    		".delete": "isOwner(user, get('teams', data.teamId)) || isOwner(user, data)",
    		"*": {
    			teamId: {
    				".update": "newData.teamId = data.teamId"
    			},
    			status: {
    				".create": "newData.status = 'pending'"
    			}
    		}
    	}
    };
    var settings = {
    	identity: identity,
    	protectedData: protectedData,
    	seedData: seedData,
    	rules: rules$1
    };

    const plugins = [
        storage(settings),
        auth(settings),
        util$2(),
        rules(settings)
    ];

    const server = http__default['default'].createServer(requestHandler(plugins, services));

    const port = 3030;
    server.listen(port);
    console.log(`Server started on port ${port}. You can make requests to http://localhost:${port}/`);
    console.log(`Admin panel located at http://localhost:${port}/admin`);

    var softuniPracticeServer = {

    };

    return softuniPracticeServer;

})));
