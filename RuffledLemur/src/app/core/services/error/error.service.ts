import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';


@Injectable({
  providedIn: 'root'
})

export class ErrorService {
  logError(error: Error | HttpErrorResponse): void {
    //Console logging for debug
    console.error(error);

    //Send to the backend API for server-side logging to a file
    if(error instanceof HttpErrorResponse) {
      //sending HTTP errors to backend logger
      this.sendToServerLog({
        type: 'HttpError',
        status: error.status,
        statusText: error.statusText,
        url: error.url || 'unknown',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      // send client errors to backend logger
      this.sendToServerLog({
        type: 'ClientError',
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  }

  private sendToServerLog(errorData: any): void {
    //TO DO: implement a call to the backend API that handles error logging
    //which will then write the error to a file
    fetch('/api/logs/error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json'},
      body: JSON.stringify(errorData)
    }).catch(e => console.error('Failed to send error to server log', e));
  }
}
