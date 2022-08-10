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
function deletePost(blogId: string, postUrl: string) {
  return blogV1.deleteRequest(`/${blogId}/${postUrl}`);
}

// 게시글 조회
function getPost(blogId: string, postUrl: string) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>(`/${blogId}/posts/${postUrl}`);
}

// 전체 게시글 조회
function getAllPosts(size: number, cursorId: string | null = null) {
  return blogV1.getRequest<SliceDto<SimplePostDto>>('/posts', {
    cursorId: cursorId,
    size: size,
  });
}

export {
  createPost,
  modifyPost,
  deletePost,
  getPost,
  getAllPosts,
};
