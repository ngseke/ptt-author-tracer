export default function log (message: string | string[]) {
  console.log(
    Array.isArray(message)
      ? message.join('\n')
      : message
  )
}
