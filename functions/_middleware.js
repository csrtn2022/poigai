import worker from '../server/worker.js';
// context.next() delegates approved public paths to Pages static delivery.
export function onRequest(context){
 const env={...context.env,ASSETS:{fetch:()=>context.next()}};
 return worker.fetch(context.request,env,context);
}
