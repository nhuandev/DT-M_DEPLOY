import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { BlogService } from './blog.service';
import { BaseResponse } from 'src/common/base-response';
import { UsersService } from '../user/users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Public } from 'src/auth/public.decorator';

@UseGuards(JwtAuthGuard)
@Controller('api/blog')
export class BlogController {
  constructor(
    private blogService: BlogService,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  @Post('create')
  async createBlog(@Body() blogData: any) {
    if (!blogData.title || !blogData.content || !blogData.category) {
      throw new BadRequestException(new BaseResponse(400, 'Data not empty'));
    }

    const blogPayload = {
      title: blogData.title,
      content: blogData.content,
      authorId: blogData.authorId,
      category: blogData.category,
      tags: blogData.tags || ['#blogstudy'],
      status: 'published',
    };

    const newBlog = await this.blogService.create(blogPayload);

    return new BaseResponse(201, 'Blog created successfully', newBlog);
  }

  @Post('like')
  async toggleLike(
    @Body('blogId') blogId: string,
    @Body('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (!blogId) {
      throw new BadRequestException('Blog ID is required');
    }
    const data = await this.blogService.toggleLikeBlog(blogId, userId);
    if (!data) {
      throw new BadRequestException('Like blog not successfully!');
    }
    return new BaseResponse(200, 'Success', data);
  }

  @Public()
  @Get('detail')
  async detailBlog(@Query('id') id: string) {
    try {
      const blog = await this.blogService.findById(id);
      if (!blog) {
        throw new NotFoundException('Blog not found');
      }

      const user = await this.usersService.findOne({ _id: blog.authorId });
      if (!user) {
        throw new NotFoundException('Author not found');
      }

      const blogData = {
        title: blog.title,
        content: blog.content,  
        authorId: user.username,
        category: blog.category,
        tags: blog.tags,
        status: blog.status,
        likes: blog.likes,
        comments: blog.comments,
        sharedBy: blog.sharedBy.length,
        views: blog.views,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      };

      return new BaseResponse(200, 'Success', blogData);
    } catch (error) {
      throw new NotFoundException(error.message || 'Something went wrong');
    }
  }

  @Public()
  @Get('list')
  async getBlogList() {
    try {
      const blogs = await this.blogService.findAll();
      const blogList = await Promise.all(
        blogs.map(async (blog) => {
          const user = await this.usersService.findOne({ _id: blog.authorId });
          if (!user) {
            throw new NotFoundException('Author not found');
          }

          return {
            id: blog._id,
            title: blog.title,
            authorId: user.username,
            category: blog.category,
            tags: blog.tags,
            likes: blog.likes,
            sharedBy: blog.sharedBy.length,
            comments: blog.comments,
            views: blog.views,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt,
          };
        }),
      );

      // Sort blogs by createdAt in descending order (newest first)
      const sortedBlogList = blogList.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Limit the number of blogs to 18
      const limitedBlogList = sortedBlogList.slice(0, 18);

      return new BaseResponse(200, 'Success', limitedBlogList);
    } catch (error) {
      throw new NotFoundException(error.message || 'Something went wrong');
    }
  }

  @Public()
  @Get('list-page')
  async user(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 3,
  ) {
    try {
      const [blogs, total] = await this.blogService.getBlogsWithPagination(
        page,
        limit,
      );

      const blogWithAuthName = await Promise.all(
        blogs.map(async (blog) => {
          const blogObj = blog.toObject();

          // Đảm bảo id luôn tồn tại và đúng định dạng
          blogObj.id = blogObj._id.toString();

          if (blog.authorId) {
            const authorName = await this.usersService.findById(blog.authorId);
            return {
              ...blogObj,
              authorId: authorName ? authorName.username : 'Unknown',
              sharedBy: blog.sharedBy.length,
            };
          }
          return { ...blogObj, authorName: 'No authorName assigned' };
        }),
      );

      return {
        data: blogWithAuthName,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  @Post('delete')
  async deleteBlog(@Body('id') id: string) {
    console.log('Received ID:', id);
    await this.blogService.delete(id);
    return new BaseResponse(201, 'Xóa bài viết thành công');
  }

  @Put(':id')
  updateBlog(@Param('id') id: string, @Body() updateData: any) {
    return this.blogService.update(id, updateData);
  }
  
}

