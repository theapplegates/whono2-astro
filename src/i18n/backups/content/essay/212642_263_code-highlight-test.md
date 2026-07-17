---
title: Code highlighting test
description: Test the syntax highlighting effects of different programming languages
date: 2026-01-05
tags: ["code", "test"]
draft: false
---
<cloudinary-picture
  src="assets/images/Gulfstream-G800"
  alt="TODO: describe this image"
  width="1672"
  height="941"
  sizes="(min-width: 768px) 720px, 100vw"
  breakpoints="50, 351, 530, 676, 812, 909, 1000"
  picture-class="responsive-picture"
/>


This article tests the topic’s code highlighting support for various programming languages.。

## TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.status}`);
  }
  return response.json();
}
```

## Rust

```rust
fn main() {
    let numbers: Vec<i32> = (1..=10).collect();
    let sum: i32 = numbers.iter().sum();
    println!("Sum of 1 to 10: {}", sum);
}
```

## Go

```go
package main

import "fmt"

func main() {
    messages := make(chan string)
    
    go func() {
        messages <- "Hello, Goroutine!"
    }()
    
    msg := <-messages
    fmt.Println(msg)
}
```

## SQL

```sql
SELECT 
    u.name,
    COUNT(p.id) as post_count,
    MAX(p.created_at) as last_post
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.active = true
GROUP BY u.id
HAVING post_count > 5
ORDER BY post_count DESC;
```

## JSON

```json
{
  "name": "astro-whono",
  "version": "1.0.0",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build"
  }
}
```

## YAML

```yaml
site:
  title: My Blog
  description: A personal blog built with Astro
  author:
    name: John Doe
    email: john@example.com
  social:
    - platform: twitter
      url: https://twitter.com/johndoe
    - platform: github
      url: https://github.com/johndoe
```

Use code highlighting Shiki，support 100+ programming language。
