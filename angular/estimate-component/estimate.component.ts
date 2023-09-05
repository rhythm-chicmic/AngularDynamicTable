import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppConstants, PageTitles } from 'src/app/common/constant';

@Component({
  selector: 'app-estimates-detail-page',
  templateUrl: './estimates-detail-page.component.html',
  styleUrls: ['./estimates-detail-page.component.scss']
})
export class EstimatesDetailPageComponent implements OnInit {
  records;
  estimateId;
  teamDetails;
  adminPanelEstimate;
  teamEstimate;
  canMessage=false;
  dateFormat = "dd/MM/yyyy"
  emptyValue = AppConstants.EmptyValue;
  dateTimeFormat = "dd/MM/yyyy hh:mm a"
  API_ESTIMATE_BID ='http://192.180.0.127:4149/api/estimate';
  isManagement=false;
  constructor(private activeRoute:ActivatedRoute,private http:HttpClient) { 
    this.estimateId = this.activeRoute.snapshot.params['id'];
    this.canMessage = this.activeRoute.snapshot.queryParams['viewMessage'];
    this.isManagement=this.activeRoute.snapshot.queryParams['isManagement'];
  }

  ngOnInit(): void {
    this.apiCalls();
  }

  apiCalls(){
    this.http.get(`${this.API_ESTIMATE_BID}?estimateId=${this.estimateId}`).subscribe((response:any)=>{
      this.records = response?.data?.data[0];
      this.teamEstimate = this.records?.teamEstimate.flatMap((tech:any)=>{
        let data=[];
        if(tech?.team){
          data.push(...tech?.team);
        }
        if(tech?.backend){
          data.push(...tech?.backend);
        }
        if(tech?.design){
          data.push(...tech?.design);
        }
        if(tech?.additional){
          data.push(...tech?.additional);
        }
        return data;
      });

      this.adminPanelEstimate = this.records?.teamEstimate.flatMap((tech:any)=>{
        let data= [];
        if(tech?.adminPanelBackend){
          data.push(...tech?.adminPanelBackend);
        }
        if(tech?.adminPanelFrontend){
          data.push(...tech?.adminPanelFrontend);
        }
        return data;
      });
      this.teamEstimate = this.teamEstimate.filter((team,index)=>{
        return index===this.teamEstimate.findIndex(obj=>obj._id===team._id);
      });
      this.adminPanelEstimate = this.adminPanelEstimate.filter((team,index)=>{
        return index === this.adminPanelEstimate.findIndex(obj=> obj._id === team._id);
      });
      this.teamDetails = response?.data?.teamDetails;
    })
  }


}
