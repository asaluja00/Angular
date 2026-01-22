import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { AiService } from '../services/ai.service';
import { HttpClient } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { SpinnerService } from '../services/spinner.service';



@Component({
    selector: 'app-login',
    imports: [FormsModule, MatFormFieldModule, MatInputModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
  account: any;
  lanID: string = '';
  userId: string = '';

  password: string = '';

  constructor(private http: HttpClient,
    private router: Router,
    private route: ActivatedRoute,
    private aiService: AiService,
    private spinnerService: SpinnerService,
  ) {

  }




  onSubmit(empId: string) {
    if (empId) {
      this.aiService.getEmpBaseDataById(empId).subscribe({
        next: (empDetails) => {
          console.log('Employee Details:', empDetails);
          const deptId = empDetails?.data?.employeeBase?.deptId;
        },
        error: (err) => {
          console.error('Error fetching employee details:', err);
        }
      });
    } else {
      console.log('Employee ID is missing');
    }
  }

//   onSubmit() {
//   this.aiService.isloginCheck().subscribe({
//     next: (res: any) => {
//       const base = res?.data?.employeeBase || res;
 
//       console.log('Employee Details:', base);
 
//       // optional usage if required later
//       // this.empId = base.empId;
//       // this.deptId = base.deptId;
//     },
//     error: (err) => {
//       console.error('Error fetching logged-in employee details:', err);
//     }
//   });
// }


}
