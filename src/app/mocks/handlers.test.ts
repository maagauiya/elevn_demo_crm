import { duplicateMethods } from '@/shared/mocks';
import { mockGroups } from './handlers';

describe('моки', () => {
  it('у каждого метода один владелец', () => {
    expect(duplicateMethods(mockGroups)).toEqual([]);
  });
});
