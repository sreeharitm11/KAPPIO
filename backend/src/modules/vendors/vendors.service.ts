import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../../database/entities/vendor.entity';
import { CreateVendorDto, UpdateVendorDto } from './dto/vendor.dto';

@Injectable()
export class VendorsService {
  constructor(
    @InjectRepository(Vendor)
    private readonly vendorsRepository: Repository<Vendor>,
  ) {}

  async create(dto: CreateVendorDto) {
    const vendor = this.vendorsRepository.create(dto);
    return this.vendorsRepository.save(vendor);
  }

  async findAll() {
    return this.vendorsRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const vendor = await this.vendorsRepository.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, dto: UpdateVendorDto) {
    const vendor = await this.findOne(id);
    Object.assign(vendor, dto);
    return this.vendorsRepository.save(vendor);
  }

  async remove(id: string) {
    const vendor = await this.findOne(id);
    return this.vendorsRepository.remove(vendor);
  }
}
