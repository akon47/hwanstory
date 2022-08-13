import { blogV1 } from './index';
import DataTransferObject, { SliceDto } from '@/api/models/common.dtos';
import { PostDto, PostRequestDto, SimplePostDto } from '@/api/models/blog.dtos';

// 게시글 작성
function createPost(postRequestDto: PostRequestDto) {
  return blogV1.postRequest<PostDto>('/posts', null, postRequestDto);
}

// 게시글 수정
function modifyPost(postUrl: string, postRequestDto: PostRequestDto) {
  return blogV1.putRequest<PostDto>(`/${postUrl}`, null, postRequestDto);
}

// 게시글 삭제
function deletePost(postUrl: string) {
  return blogV1.deleteRequest(`/posts/${postUrl}`);
}

// 게시글 조회
function getPost(blogId: string, postUrl: string) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>(`/${blogId}/posts/${postUrl}`);
}

// 특정 블로그 전체 게시글 조회
function getPosts(blogId: string, size: number, cursorId: string | null = null) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>(`/${blogId}/posts`, {
    cursorId: cursorId,
    size: size,
  });
}

// 전체 게시글 조회
function getAllPosts(size: number, cursorId: string | null = null) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>('/posts', {
    cursorId: cursorId,
    size: size,
  });
}

// 게시글 좋아요
function likePost(blogId: string, postUrl: string) {
  return blogV1.postRequest(`/${blogId}/posts/${postUrl}/likes`);
}

// 게시글 좋아요 취소
function unlikePost(blogId: string, postUrl: string) {
  return blogV1.deleteRequest(`/${blogId}/posts/${postUrl}/likes`);
}

export {
  createPost,
  modifyPost,
  deletePost,
  getPost,
  getPosts,
  getAllPosts,
  likePost,
  unlikePost
};
