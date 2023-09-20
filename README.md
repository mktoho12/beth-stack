# beth-stack

To install dependencies:

```bash
asdf plugin add bun
asdf install bun latest
asdf global bun 1.0.2

brew install tursodatabase/tap/turso
turso auth signup
turso db create my-db
```

Copy and edit `.env`
```bash
turso db show my-db --url
turso db tokens create my-db
```

To run:

```bash
bun dev
```

This project was created using `bun init` in bun v1.0.2. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
