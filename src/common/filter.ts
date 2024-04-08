import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Response, Request } from 'express';


@Catch(HttpException)
export class Filter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {

        const ctx = host.switchToHttp()

        const request = ctx.getRequest<Request>()

        const response = ctx.getResponse<Response>()

        const status = exception.getStatus()

        const exceptionRes = exception.getResponse() as any;

        response.status(status).json({
            time: new Date(),
            data: exceptionRes,
            errormsg: exceptionRes.errormsg,
            errorno: exceptionRes.errorno,
            path: request.url
        })
    }
}