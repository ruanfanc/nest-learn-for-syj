import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SubmitCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { Case } from './entities/case.entity';

@Injectable()
export class CasesService {
  @InjectRepository(Case) private caseRepository: Repository<Case>

  async submit(submitCaseDto: SubmitCaseDto) {
    if(submitCaseDto.id) {
      const caseFinded = await this.caseRepository.find({ where: { id: submitCaseDto.id } })

      if (caseFinded) {
        await this.caseRepository
        .createQueryBuilder()
        .update(Case).set(submitCaseDto).where('id=:id', { id: submitCaseDto.id }).execute()

        return {
          success: 200
        }
      }

      throw new HttpException({
        errorno: 2,
        errormsg: `未找到id为${submitCaseDto.id}的帖子、案件`,
      }, HttpStatus.BAD_REQUEST);
    }

    if(submitCaseDto.isSubmit) {
      await this.caseRepository.save({ 
        ...submitCaseDto,
        
      })
    }
  }

  findAll() {
    return `This action returns all cases`;
  }

  findOne(id: number) {
    return `This action returns a #${id} case`;
  }

  update(id: number, updateCaseDto: UpdateCaseDto) {
    return `This action updates a #${id} case`;
  }

  remove(id: number) {
    return `This action removes a #${id} case`;
  }
}
