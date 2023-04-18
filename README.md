# Express.js Login and Registration with Two-Factor Authentication for the WSB Gdańsk

This is an Express.js server that includes registration, login, and two-factor authentication functionality for a Polish phone number (+48). The server uses the Nexmo API to send SMS messages, and passwords are hashed and salted using bcrypt.

## Installation

1. Clone the repository to your local machine.
2. Install dependencies using `npm install`.
3. Set up environment variables for your VONAGE API key, secret. You can do this by creating a `.env` file in the root directory of the project, and adding the following lines:

```
VONAGE_API_KEY=your_api_key
VONAGE_API_SECRET=your_api_secret
MY_BRAND_NAME=your_brand_name
MONGODB_URI=your_db_link
```

4. Start the server using `npm start`.

## Usage

### Registration

To register a new user, make a `POST` request to `/register` with the following parameters:

```
{
"username": "your_username",
"password": "your_password",
"phone": "your_phone_number"
}

```

The server will respond with a `200` status code and a success message if the registration is successful.

### Login

To log in to an existing account, make a `POST` request to `/login` with the following parameters:

```
{
"username": "your_username",
"password": "your_password"
}
```

If the username and password are correct, the server will send a verification code to the user's phone number via SMS. The user will then need to enter this code to complete the login process.

### Verification

To verify a user, make a `POST` request to `/verify` with the following parameters:

```
{
  "request_id": "<requestId that is stored in user model>",
  "code": "<verification code from your phone>"
}
```

If the verification code is correct, the user will be logged in

## Credits

This server was created as part of a homework assignment for the WSB Gdańsk. It was built by Artem Verbytskyi.
