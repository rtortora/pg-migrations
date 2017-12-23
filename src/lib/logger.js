export default class Logger {
  static debug(message) { return this._log('[dbg] ', message); }
  static info(message)  { return this._log('[info]', message); }
  static warn(message)  { return this._log('[WARN]', message); }
  static error(message) { return this._log('[ERR!]', message); }

  static _log(prefix, message) {
    console.log(`${prefix} ${message.toString()}`);
  }
}
