import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationGateway } from 'src/notification/notification.gateway';
import { Blog } from 'src/schema/blog.schema';
import { Notify } from 'src/schema/notify.schema';

@Injectable()
export class BlogService {
  constructor(@InjectModel(Blog.name) private blogModel: Model<Blog>,
  private notificationGateway: NotificationGateway
) {}

  async create(blog: any): Promise<Blog> {
    const newBlog = new this.blogModel(blog);
    return newBlog.save();
  }

  async findById(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException('Invalid Blog ID');
      }
      const objectId = new Types.ObjectId(id);
      const blog = await this.blogModel
        .findById(objectId)
        .populate({
          path: 'comments',
          options: { sort: { createdAt: -1 } },
        })
        .exec();

      if (!blog) {
        throw new NotFoundException('Blog not found');
      }
      return blog;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async findAll() {
    return this.blogModel
      .find({ status: "published" }) // Lọc chỉ lấy bài viết đã xuất bản
      .populate({
        path: 'comments',
        select: '-__v -updatedAt',
        options: { sort: { createdAt: -1 } },
        populate: {
          path: 'userId',
          select: 'username',
        },
      })
      .exec();
  }

  async getBlogsWithPagination(
    page: number,
    limit: number,
  ): Promise<[any[], number]> {
    const skip = (page - 1) * limit;
    const total = await this.blogModel.countDocuments();
    const users = await this.blogModel.find().skip(skip).limit(limit).sort({ createdAt: -1 }); // Sắp xếp bài viết mới nhất trước;

    return [users, total];
  }

  async delete(data: any): Promise<Blog> {
    const blog = this.blogModel.findById(data);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return blog.deleteOne();
  }

  async updateComment(blogId: string, commentId: string): Promise<any> {
    if (!Types.ObjectId.isValid(blogId)) {
      throw new NotFoundException('Invalid blog ID');
    }
    if (!Types.ObjectId.isValid(commentId)) {
      throw new NotFoundException('Invalid comment ID');
    }
    const blog = await this.blogModel.findById(blogId);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    const commentExists = blog.comments.includes(new Types.ObjectId(commentId));
    if (commentExists) {
      throw new NotFoundException('Comment already exists in this blog');
    }
    const updatedBlog = await this.blogModel.findByIdAndUpdate(
      blogId,
      { $push: { comments: new Types.ObjectId(commentId) } },
      { new: true },
    );
    if (!updatedBlog) {
      throw new NotFoundException('Failed to update blog with comment');
    }
    return true;
  }

  async toggleLikeBlog(blogId: string, userId: string): Promise<any> {
    try {
      const blog = await this.blogModel.findById(blogId);
      if (!blog) {
        throw new NotFoundException('Comment not found');
      }
      if (!Array.isArray(blog.likes)) {
        blog.likes = [];
      }
      const hasLiked = blog.likes.some(
        (like) => like.toString() === userId.toString(),
      );
      const update = hasLiked
        ? { $pull: { likes: userId } } // Bỏ thích
        : { $push: { likes: userId } }; // Thêm thích
      const updateBlog = await this.blogModel.findByIdAndUpdate(
        blogId,
        update,
        {
          new: true,
        },
      );

      if (!updateBlog) {
        throw new NotFoundException('Failed to update blog');
      }
      return updateBlog;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }


  async reportBlog(reportData: Notify) {
    const blog = await this.blogModel.findById(reportData.blogId);
    if (!blog) {
      throw new NotFoundException('Bài viết không tồn tại');
    }
  
    // Chuyển bài viết sang trạng thái 'processing'
    blog.status = 'processing';
    await blog.save();
  
    // Gửi thông báo đến admin qua WebSocket
    this.notificationGateway.sendReportNotification(reportData.blogId, reportData.status, reportData.category, reportData.reason);
  
  }
  
}
