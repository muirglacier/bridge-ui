export const getScalingProps = (width: number, height: number) => {
  const widthRatioEm = `${width / height}em`
  const viewBox = `0 0 ${width} ${height}`
  const style = { width: widthRatioEm }
  return { viewBox, style }
}

export const getScalingPropsFactored = (width: number, height: number, factor: number) => {
  const widthRatioEm = `${width*factor / height}em`
  const viewBox = `0 0 ${width} ${height}`
  const style = { width: widthRatioEm, height: "auto"}
  return { viewBox, style }
}
