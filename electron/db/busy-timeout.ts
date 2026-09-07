// How long a connection waits on another holder of the database before failing
// with SQLITE_BUSY. better-sqlite3's default is 5s, which was not enough when a
// new app instance opened the database while the previous instance was still
// tearing down its own connections (quit, then reopen straight away): the
// failure aborted startup. Every repository opens with this.
export const DATABASE_BUSY_TIMEOUT_MS = 15_000
