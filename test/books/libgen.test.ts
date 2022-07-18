import { BOOKS } from '../../src/providers';

jest.setTimeout(120000);

test('returns true', async () => {
  const libgen = new BOOKS.Libgen();
  const data = await libgen.search('batman', 1);
  expect(data.hasNextPage).toEqual(true);
});

test('does nothing', async () => {
  const libgen = new BOOKS.Libgen();
  const data = await libgen.scrapeBook(
    'http://libgen.rs/book/index.php?md5=511972AA87FD4DA91350A6079F887588'
  );
  expect(data).not.toBeNull();
});
