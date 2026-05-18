import { Article, ArticleStatus } from '@prisma/client';
import { JwtPayload } from '../types';

export const canViewArticle = (
  article: Pick<Article, 'status' | 'authorId' | 'deletedAt'>,
  user?: JwtPayload
): boolean => {
  if (article.deletedAt !== null) {
    return false;
  }

  if (article.status === ArticleStatus.PUBLISHED) {
    return true;
  }

  return user?.sub === article.authorId;
};
