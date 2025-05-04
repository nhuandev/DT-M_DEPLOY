import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment } from 'src/schema/comment.schema';
import { BlogService } from '../blog/blog.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    private readonly blogService: BlogService,
  ) {}

  async createComment(commentData: Comment): Promise<Comment> {
    try {
      const newComment = new this.commentModel({
        ...commentData,
      });
      const savedComment = await newComment.save();
      if (commentData.parentId) {
        const parentComment = await this.commentModel.findById(
          commentData.parentId,
        );
        if (!parentComment) {
          throw new NotFoundException('Parent comment not found');
        }
        await this.commentModel.findByIdAndUpdate(commentData.parentId, {
          $push: { children: savedComment._id },
        });
      }
      const blogUpdated = await this.blogService.updateComment(
        commentData.blogId.toString(),
        (savedComment._id as Comment).toString(),
      );
      if (!blogUpdated) {
        throw new NotFoundException('Blog not found');
      }
      return savedComment;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  // Lấy tất cả comment theo cấp bậc
  async getAllComments(): Promise<Comment[]> {
    return this.commentModel
      .find()
      .populate('userId', 'username') // Lấy thông tin user
      .populate('children')
      .exec();
  }

  async findAllCommentsByBlogId(blogId: string) {
    if (!Types.ObjectId.isValid(blogId)) {
      throw new NotFoundException('Invalid Blog ID');
    }
    const comments = await this.commentModel
      .find({ blogId })
      .populate({
        path: 'userId',
        select: 'username',
      })
      .exec();
    if (comments.length === 0) {
      return [];
    }
    const plainComments = comments.map((comment) => comment.toObject());
    const parentComments: any[] = plainComments.filter(
      (comment) => !comment.parentId,
    );
    const childComments: any[] = plainComments.filter(
      (comment) => comment.parentId,
    );
    parentComments.forEach((parent) => {
      parent['children'] = childComments.filter(
        (child) => child.parentId?.toString() === parent._id?.toString(),
      );
    });
    return parentComments;
  }

  async updateComment(
    commentId: Types.ObjectId,
    content: string,
  ): Promise<Comment> {
    const comment = await this.commentModel.findByIdAndUpdate(
      commentId,
      { content },
      { new: true },
    );
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  // 👉 Thêm hoặc bỏ thích
  async toggleLike(commentId: Types.ObjectId, userId: Types.ObjectId) {
    try {
      const comment = await this.commentModel.findById(commentId);
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }
      if (!Array.isArray(comment.likes)) {
        comment.likes = [];
      }
      const hasLiked = comment.likes.some(
        (like) => like.toString() === userId.toString(),
      );
      const update = hasLiked
        ? { $pull: { likes: userId } } // Bỏ thích
        : { $push: { likes: userId } }; // Thêm thích
      const updatedComment = await this.commentModel.findByIdAndUpdate(
        commentId,
        update,
        {
          new: true,
        },
      );

      if (!updatedComment) {
        throw new NotFoundException('Failed to update comment');
      }
      return updatedComment;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // 👉 Xóa bình luận (Xóa cả bình luận con)
  async deleteComment(commentId: Types.ObjectId) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Comment not found');

    // Xóa tất cả bình luận con liên quan
    await this.commentModel.deleteMany({ _id: { $in: comment.children } });

    // Xóa chính bình luận
    await this.commentModel.findByIdAndDelete(commentId);
    return { message: 'Comment and its children deleted' };
  }
}
