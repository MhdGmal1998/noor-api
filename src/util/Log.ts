import "colorts/lib/string"

export default class Log {
  static debug = (message: any) => console.log(`[Debug]: `.cyan + message)
  static error = (message: any) => console.log(`[Error]: `.red + `${message}`)
  static info = (message: any) => console.log(`[Info]: ${message}`)
  static warning = (message: any) => console.log(`[Warning]: `.yellow + message)
}
