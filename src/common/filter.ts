import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Response, Request } from 'express';


@Catch(HttpException)
export class Filter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {

        const ctx = host.switchToHttp()

        const request = ctx.getRequest<Request>()

        const response = ctx.getResponse<Response>()

        const status = exception.getStatus()

        response.status(status).json({
            time: new Date(),
            data: exception.getResponse(),
            errormsg: exception.message,
            errorno: 1,
            path: request.url
        })
    }
}