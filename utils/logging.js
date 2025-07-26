export function log(message, ...args) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}]`, message, ...args);
}

export function logError(error, ...args) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}]`, error, ...args);
}

export function logSqlScript(scriptName) {
    log(`Executing script:`, scriptName);
}

export function logSqlCommand(command, parameters) {
    log(`Executing SQL:`, command, parameters);
}
