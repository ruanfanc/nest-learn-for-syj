import { CallHandler, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Data<T> {
  data: T;
}

@Injectable()
export class Response<T> implements NestInterceptor {
  intercept(context, next: CallHandler): Observable<Data<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data?.status) {
          return data;
        }
        return {
          data,
          status: 0,
          message: '成功',
        };
      }),
    );
  }
}
