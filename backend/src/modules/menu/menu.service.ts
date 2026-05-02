import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { MenuItem } from '../../database/entities/menu-item.entity';
import { PaginatedResponse } from '../../shared/interfaces/paginated-response.interface';
import { toMoneyString } from '../../common/utils/money.util';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { MenuQueryDto } from './dto/menu-query.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemsRepository: Repository<MenuItem>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
  ) {}

  async findAll(query: MenuQueryDto): Promise<PaginatedResponse<MenuItem>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: FindOptionsWhere<MenuItem> = {};

    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }
    if (query.availableOnly === 'true') {
      where.available = true;
    }

    const [items, total] = await this.menuItemsRepository.findAndCount({
      where,
      relations: ['category'],
      order: { name: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const filteredItems =
      query.categoryName && !query.categoryId
        ? items.filter((item) => item.category.name === query.categoryName)
        : items;

    return {
      items: filteredItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(dto: CreateMenuItemDto) {
    const category = await this.categoriesRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const menuItem = this.menuItemsRepository.create({
      ...dto,
      price: toMoneyString(dto.price),
    });
    return this.menuItemsRepository.save(menuItem);
  }

  async update(id: string, dto: UpdateMenuItemDto) {
    const item = await this.menuItemsRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    Object.assign(item, {
      ...dto,
      price: dto.price !== undefined ? toMoneyString(dto.price) : item.price,
    });
    return this.menuItemsRepository.save(item);
  }

  async toggleAvailability(id: string) {
    const item = await this.menuItemsRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Menu item not found');
    }

    item.available = !item.available;
    return this.menuItemsRepository.save(item);
  }
}
