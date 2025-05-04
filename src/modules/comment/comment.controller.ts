import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Types } from 'mongoose';
import { BaseResponse } from 'src/common/base-response';
import { Comment } from 'src/schema/comment.schema';

@Controller('api/comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  // Tạo bình luận (hỗ trợ bình luận cha và con)
  @Post('create')
  async createComment(@Body('Comment') commentData: Comment) {
    if (
      !commentData ||
      !commentData.userId ||
      !commentData.blogId ||
      !commentData.content
    ) {
      throw new BadRequestException('Data not empty');
    }
    const comment = this.commentService.createComment(commentData);
    return new BaseResponse(201, 'Comment created successfully', comment);
  }

  @Get('comment-blog')
  async getAllCommentsByBlogId(@Query('blogId') blogId: string) {
    if (!blogId) {
      throw new BadRequestException('Blog ID is required');
    }
    const commentBlog =
      await this.commentService.findAllCommentsByBlogId(blogId);
    return new BaseResponse(200, 'Success', commentBlog);
  }

  // Lấy tất cả bình luận
  @Get()
  async getAllComments() {
    return this.commentService.getAllComments();
  }

  // Cập nhật bình luận
  @Put(':commentId')
  async updateComment(
    @Param('commentId') commentId: string,
    @Body('content') content: string,
  ) {
    return this.commentService.updateComment(
      new Types.ObjectId(commentId),
      content,
    );
  }

  // Toggle thích bình luận
  @Post('like')
  async toggleLike(
    @Body('commentId') commentId: string,
    @Body('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    if (!commentId) {
      throw new BadRequestException('Comment ID is required');
    }
    const data = await this.commentService.toggleLike(
      new Types.ObjectId(commentId),
      new Types.ObjectId(userId),
    );
    if (!data) {
      throw new BadRequestException('Like comment not successfully!');
    }
    return new BaseResponse(200, 'Success', data);
  }

  // Xóa bình luận
  @Post('delete')
  async deleteComment(@Query('commentId') commentId: string) {
    return this.commentService.deleteComment(new Types.ObjectId(commentId));
  }
}
