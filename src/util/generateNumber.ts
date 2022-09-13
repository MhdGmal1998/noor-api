const generateNumber = (digits: number): number => {
  const number = Math.floor(Math.random() * Math.pow(10, digits))
  if (number.toString().length !== digits) return generateNumber(digits)
  return number
}

export default generateNumber
