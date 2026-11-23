import articles from './archive.json';
import type {StudioState,Section} from './model';
const make=(id:string,type:Section['type'],title:string,...articleIds:string[]):Section=>({id,type,title,visible:true,articleIds});
export const seed:StudioState={articles,editions:{
 folio:{name:'ஷபா',accent:'#d8b97c',density:'comfortable',sections:[
 make('cover','lead','முகப்புச் செய்திகள்','voc-remembrance','rasipuram-case','crop-credit','kanda-sashti'),
 make('portfolio','grid','மாவட்டச் செய்திகள்','rail-council','joint-health','cauvery-delta','erode-music'),
 make('education','feature','சிறப்புப் பதிவு','thirumanimutharu'),
 make('notebook','list','கல்வியும் களமும்','sona-graduation','teachers-day','little-flower-athletics','community-clinic','rajaganapathi')]}
}};
