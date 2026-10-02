# Project Flow Guide (Hinglish)

Yeh project Node.js aur Express par bana AI chat API hai. Ismein users, chats aur messages MongoDB mein store hote hain, aur chat responses ke liye Google Gemini API use hoti hai.

## 1. Application start ka flow

1. `index.js` mein `dotenv/config` environment variables load karta hai.
2. Express JSON body parsing aur cookie parsing middleware setup karta hai.
3. `/user`, `/chat`, aur `/msg` ke routers app ke saath mount hote hain.
4. App configured `MONGO_URL` se MongoDB connect karta hai.
5. Database connection successful hone ke baad HTTP server `PORT` par start hota hai.

## 2. Sign-up aur login

### Sign-up (`POST /user/signup`)

1. Request body ko Zod sign-up schema se validate kiya jaata hai.
2. API check karti hai ki email pehle se registered toh nahi hai.
3. Password ko bcrypt se hash karke user ko MongoDB mein save kiya jaata hai.
4. JWT banakar HTTP-only `token` cookie mein bheja jaata hai.
5. Response mein basic account information aati hai; password return nahi hota.

### Login (`POST /user/login`)

1. Email aur password validate hote hain.
2. API email se user dhoondhti hai aur bheje gaye password ko saved bcrypt hash se compare karti hai.
3. Credentials sahi hone par JWT cookie set hoti hai aur basic user information return hoti hai.

Abhi JWT aur cookie dono ki lifetime paanch minute hai. Logout (`POST /user/logout`) cookie clear karta hai.

## 3. Protected routes ka authentication

Chat aur message routers par `authUserMiddleware` laga hua hai. Profile aur account-delete routes par bhi ye middleware alag se lagta hai.

Har protected request par middleware:

1. `token` cookie read karta hai.
2. `JWT_SECRET` se JWT verify karta hai.
3. MongoDB mein token se judi user entry dhoondhta hai.
4. User document ko `req.user` par set karke request aage route handler ko deta hai.

Agar cookie missing ho ya user na mile, toh request reject ho jaati hai.

## 4. Chat aur message ka flow

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

## 5. Conversation summaries

Message response bhejne ke baad summary helper call hota hai. Ye check karta hai ki kam-se-kam 20 unsummarized messages hain ya nahi. Haan hone par pichhle summary ke saath us message chunk ka summary Gemini se banwaya jaata hai. Iska goal purane context ko compact rakhna hai, taaki aage ke prompts mein use kiya ja sake.

## 6. Main API routes

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

## 7. Code mein abhi ke kuch gaps

- `POST /chat/createChat` abhi `req.userId` use karta hai, lekin authentication middleware `req.user` set karta hai. Isliye is route se chat creation required `userId` field par fail ho sakti hai.
- Message-list handler query result ko `message` naam deta hai, lekin response mein `messages` return karta hai. Saath hi, `find()` ke array result ko single chat ki tarah check kiya gaya hai. Is wajah se `GET /msg/:chatId` fail ho sakta hai ya chat na hone par access ko galat tareeke se allow kar sakta hai.
- Summary helper chat document par summary aur usage fields update karta hai, lekin document ko save nahi karta. Isliye naya summary aur uska usage persist nahi hota.
- Account deletion handler mein `findAll` use hua hai, jo Mongoose model query method nahi hai, aur delete operations `await` bhi nahi kiye gaye. Account deletion expected tareeke se complete na ho.
- Package ka current `npm test` script placeholder hai jo error ke saath exit karta hai; package mein automated test suite configured nahi hai.
