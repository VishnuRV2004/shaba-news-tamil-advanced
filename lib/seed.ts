import articles from './archive.json';
import type {StudioState,Section} from './model';
const make=(id:string,type:Section['type'],title:string,...articleIds:string[]):Section=>({id,type,title,visible:true,articleIds});
export const seed:StudioState={articles,editions:{
 folio:{name:'ஷபா',accent:'#d8b97c',density:'comfortable',sections:[
 make('cover','lead','அட்டைப்படக் கட்டுரை','thirumanimutharu','cauvery-delta','erode-music'),
 make('portfolio','grid','கலை மற்றும் வாழ்வியல்','rajaganapathi','voc-remembrance','kanda-sashti'),
 make('education','feature','கல்லூரிக் குறிப்புகள்','sona-graduation'),
 make('notebook','list','மாவட்டப் பதிவுகள்','little-flower-athletics','joint-health','teachers-day','rail-council')]}
}};
