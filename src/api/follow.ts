import { blogV1, feedV1, followV1 } from './index';
import { SliceDto } from '@/api/models/common.dtos';
import { SimpleAccountDto } from '@/api/models/account.dtos';
import { SimplePostDto } from '@/api/models/blog.dtos';

// 대상 블로그(사용자) 팔로우
function follow(blogId: string) {
  return followV1.postRequest(`/${blogId}`);
}

// 대상 블로그(사용자) 팔로우 취소
function unfollow(blogId: string) {
  return followV1.deleteRequest(`/${blogId}`);
}

// 팔로우 여부 조회 (팔로우 중이면 resolve, 아니면 404로 reject)
function isFollowing(blogId: string) {
  return followV1.getRequest(`/${blogId}`);
}

// 팔로워 목록 조회
function getFollowers(blogId: string, size: number, cursorId: string | null = null) {
  return blogV1.getRequest<SliceDto<SimpleAccountDto>>(`/${blogId}/followers`, {
    cursorId: cursorId,
    size: size,
  });
}

// 팔로잉 목록 조회
function getFollowings(blogId: string, size: number, cursorId: string | null = null) {
  return blogV1.getRequest<SliceDto<SimpleAccountDto>>(`/${blogId}/followings`, {
    cursorId: cursorId,
    size: size,
  });
}

// 팔로잉 피드(내가 팔로우하는 사용자들의 공개 게시글) 조회
function getFollowingFeed(size: number, cursorId: string | null = null) {
  return feedV1.getRequest<SliceDto<SimplePostDto>>(`/following`, {
    cursorId: cursorId,
    size: size,
  });
}

export { follow, unfollow, isFollowing, getFollowers, getFollowings, getFollowingFeed };
