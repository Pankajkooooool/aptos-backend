// times: [t0, t1, ...], values: [v0, v1, ...]
export function predictNext(times: number[], values: number[]) {
  if (times.length < 2) return values.at(-1) ?? 0;
  const n = times.length;
  const meanX = times.reduce((a,b)=>a+b,0) / n;
  const meanY = values.reduce((a,b)=>a+b,0) / n;
  let num = 0, den = 0;
  for (let i=0;i<n;i++){ num += (times[i]-meanX)*(values[i]-meanY); den += (times[i]-meanX)**2; }
  const m = den === 0 ? 0 : num/den;
  const c = meanY - m*meanX;
  const nextT = Math.max(...times) + (times[1]-times[0]); // assume uniform step
  return m*nextT + c;
}
