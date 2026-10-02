# Project Flow Guide

This project is a Node.js/Express API for user accounts and AI chat. It stores users, chats, and messages in MongoDB and sends chat context to the Google Gemini API.

## English

### 1. Application startup

1. `index.js` loads environment variables with `dotenv/config`.
2. Express JSON parsing and cookie parsing middleware are registered.
3. The `/user`, `/chat`, and `/msg` routers are mounted.
4. The app connects to MongoDB using the configured `MONGO_URL`.
5. After the database connection succeeds, the HTTP server listens on `PORT`.

### 2. Sign-up and login

**Sign-up (`POST /user/signup`)**

1. The request body is validated with the Zod sign-up schema.
2. The API checks whether the email is already registered.
3. The password is hashed with bcrypt before the user is saved to MongoDB.
4. A JWT is created and sent as an HTTP-only `token` cookie.
5. The response contains basic account information; it does not return the password.

**Login (`POST /user/login`)**

1. The email and password are validated.
2. The API finds the user by email and compares the submitted password with the stored bcrypt hash.
3. If the credentials are valid, a JWT is set in the same cookie and basic user information is returned.

The JWT lifetime and cookie lifetime are currently five minutes. Logout (`POST /user/logout`) clears the cookie.

### 3. Authentication for protected routes

The chat and message routers apply `authUserMiddleware` to their routes. The profile and account-deletion routes use it individually.

For each protected request, the middleware:

1. Reads the `token` cookie.
2. Verifies the JWT using `JWT_SECRET`.
3. Looks up the referenced user in MongoDB.
4. Places the user document on `req.user` and passes the request to the route handler.

If the cookie is missing or the user cannot be found, the request is rejected.

### 4. Chat and message flow

```text
Client
  -> POST /msg/:chatId (existing chat) or POST /msg (start a chat)
  -> Authentication middleware
  -> Validate message and check/reset user token allowance
  -> Find the user's chat or create a new chat
  -> Build Gemini context from the system instructions, saved summary,
     unsummarized messages, and the new message
  -> Request a response from Gemini
  -> Save the user message and assistant reply in MongoDB
  -> Update chat and user token-usage counters
  -> Return the reply and usage information to the client
  -> Check whether enough messages exist to summarize
```

For a new chat, the client sends the selected `model` and message `content` to `POST /msg`. For an existing chat, it sends the message to `POST /msg/:chatId`; the model comes from the saved chat.

The Gemini service receives the chat's model and prepared conversation context. It returns the reply and token counts. The chat record stores the topic, model, summary, message count, and chat-level usage. The user record stores usage against a token limit and lifetime usage.

### 5. Conversation summaries

The summary helper is called after a message response is sent. It checks whether at least 20 messages remain unsummarized, then asks Gemini to summarize that chunk together with the previous summary. The summary is intended to keep older context compact when preparing later prompts.

### 6. Main API routes

| Method | Route | Purpose | Authentication |
|---|---|---|---|
| `POST` | `/user/signup` | Create an account | No |
| `POST` | `/user/login` | Log in | No |
| `POST` | `/user/logout` | Clear the login cookie | No |
| `GET` | `/user/profile` | Get the current user's profile | Yes |
| `GET` | `/user/deleteAccount` | Delete the current user's account | Yes |
| `POST` | `/chat/createChat` | Create a chat for a selected model | Yes |
| `GET` | `/chat/getRecentChat` | List up to 20 recent chats | Yes |
| `GET` | `/chat/:chatId` | Get one chat | Yes |
| `DELETE` | `/chat/:chatId` | Delete a chat and its messages | Yes |
| `GET` | `/msg/:chatId` | Get a chat's messages | Yes |
| `POST` | `/msg` | Send the first message and start a chat | Yes |
| `POST` | `/msg/:chatId` | Send a message to an existing chat | Yes |

### 7. Current implementation notes

- `POST /chat/createChat` currently reads `req.userId`, but the authentication middleware sets `req.user`. As a result, chat creation through this route may fail its required `userId` field.
- The message-list handler currently declares the query result as `message` but returns `messages`, and it checks a `find()` result as though it were a single chat. The `GET /msg/:chatId` route may therefore fail or incorrectly allow access when the chat does not exist.
- The summary helper updates summary and usage fields on the chat document but does not currently save that document. The new summary and its added usage are therefore not persisted by that helper.
- The account-deletion handler uses `findAll`, which is not a Mongoose model query method, and does not await its delete operations. Account deletion may not complete as intended.
- The package currently defines a placeholder `npm test` script that exits with an error; no automated test suite is configured there.

## Hinglish (Hindi + English)

### 1. Application start ka flow

1. `index.js` mein `dotenv/config` environment variables load karta hai.
2. Express JSON body parsing aur cookie parsing middleware setup karta hai.
3. `/user`, `/chat`, aur `/msg` ke routers app ke saath mount hote hain.
4. App configured `MONGO_URL` se MongoDB connect karta hai.
5. Database connection successful hone ke baad HTTP server `PORT` par start hota hai.

### 2. Sign-up aur login

**Sign-up (`POST /user/signup`)**

1. Request body ko Zod sign-up schema se validate kiya jaata hai.
2. API check karti hai ki email pehle se registered toh nahi hai.
3. Password ko bcrypt se hash karke user ko MongoDB mein save kiya jaata hai.
4. JWT banakar HTTP-only `token` cookie mein bheja jaata hai.
5. Response mein basic account information aati hai; password return nahi hota.

**Login (`POST /user/login`)**

1. Email aur password validate hote hain.
2. API email se user dhoondhti hai aur bheje gaye password ko saved bcrypt hash se compare karti hai.
3. Credentials sahi hone par JWT cookie set hoti hai aur basic user information return hoti hai.

Abhi JWT aur cookie dono ki lifetime paanch minute hai. Logout (`POST /user/logout`) cookie clear karta hai.

### 3. Protected routes ka authentication

Chat aur message routers par `authUserMiddleware` laga hua hai. Profile aur account-delete routes par bhi ye middleware alag se lagta hai.

Har protected request par middleware:

1. `token` cookie read karta hai.
2. `JWT_SECRET` se JWT verify karta hai.
3. MongoDB mein token se judi user entry dhoondhta hai.
4. User document ko `req.user` par set karke request aage route handler ko deta hai.

Agar cookie missing ho ya user na mile, toh request reject ho jaati hai.

### 4. Chat aur message ka flow

```text
Client
  -> POST /msg/:chatId (existing chat) ya POST /msg (nayi chat)
  -> Authentication middleware
  -> Message validate hota hai aur user token allowance check/reset hoti hai
  -> User ki chat dhoondhi jaati hai ya nayi chat banti hai
  -> Gemini ke liye context banta hai: system instructions, saved summary,
     unsummarized messages, aur current message
  -> Gemini se response manga jaata hai
  -> User message aur assistant reply MongoDB mein save hote hain
  -> Chat aur user ke token-usage counters update hote hain
  -> Reply aur usage information client ko return hoti hai
  -> Check hota hai ki messages ka summary banana chahiye ya nahi
```

Nayi chat ke liye client `POST /msg` par selected `model` aur message `content` bhejta hai. Existing chat ke liye message `POST /msg/:chatId` par bheja jaata hai; model saved chat se liya jaata hai.

Gemini service ko chat ka model aur tayyar conversation context milta hai. Wahan se reply aur token counts aate hain. Chat record mein topic, model, summary, message count aur chat-level usage hoti hai. User record mein token limit ke against current usage aur lifetime usage store hoti hai.

### 5. Conversation summaries

Message response bhejne ke baad summary helper call hota hai. Ye check karta hai ki kam-se-kam 20 unsummarized messages hain ya nahi. Haan hone par pichhle summary ke saath us message chunk ka summary Gemini se banwaya jaata hai. Iska goal purane context ko compact rakhna hai, taaki aage ke prompts mein use kiya ja sake.

### 6. Main API routes

| Method | Route | Kaam | Authentication |
|---|---|---|---|
| `POST` | `/user/signup` | Naya account banana | Nahi |
| `POST` | `/user/login` | Login karna | Nahi |
| `POST` | `/user/logout` | Login cookie clear karna | Nahi |
| `GET` | `/user/profile` | Current user ki profile lena | Haan |
| `GET` | `/user/deleteAccount` | Current user ka account delete karna | Haan |
| `POST` | `/chat/createChat` | Selected model ke liye chat banana | Haan |
| `GET` | `/chat/getRecentChat` | Latest 20 tak chats list karna | Haan |
| `GET` | `/chat/:chatId` | Ek chat ki details lena | Haan |
| `DELETE` | `/chat/:chatId` | Chat aur uske messages delete karna | Haan |
| `GET` | `/msg/:chatId` | Chat ke messages lena | Haan |
| `POST` | `/msg` | Pehla message bhejkar chat start karna | Haan |
| `POST` | `/msg/:chatId` | Existing chat mein message bhejna | Haan |

### 7. Code mein abhi ke kuch gaps

- `POST /chat/createChat` abhi `req.userId` use karta hai, lekin authentication middleware `req.user` set karta hai. Isliye is route se chat creation required `userId` field par fail ho sakti hai.
- Message-list handler query result ko `message` naam deta hai, lekin response mein `messages` return karta hai. Saath hi, `find()` ke array result ko single chat ki tarah check kiya gaya hai. Is wajah se `GET /msg/:chatId` fail ho sakta hai ya chat na hone par access ko galat tareeke se allow kar sakta hai.
- Summary helper chat document par summary aur usage fields update karta hai, lekin document ko save nahi karta. Isliye naya summary aur uska usage persist nahi hota.
- Account deletion handler mein `findAll` use hua hai, jo Mongoose model query method nahi hai, aur delete operations `await` bhi nahi kiye gaye. Account deletion expected tareeke se complete na ho.
- Package ka current `npm test` script placeholder hai jo error ke saath exit karta hai; package mein automated test suite configured nahi hai.
