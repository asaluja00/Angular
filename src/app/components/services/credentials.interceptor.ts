import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const masterApi = "https://10.179.4.9:8067/";
    const completionsApi = "https://10.179.82.226:8443/chat";
    const uploadChunksApi = "https://10.179.82.226:8450/uploadChunks";
    const yolov_api =  "https://10.179.82.226:8543/process_video";

    if (
      req.url.startsWith(masterApi) ||
      req.url === completionsApi ||
      req.url === uploadChunksApi ||
      req.url === yolov_api
    ) {
      return next.handle(req);
    }
    const cloned = req.clone({ withCredentials: true });
    // const cloned = req.clone();
    return next.handle(cloned);
  }
}
