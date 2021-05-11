# Apollo 1337

- Author: [Anand Rajaram](https://github.com/anandrajaram21)

## Problem Statement

![challenge picture](challenge.png)

## TLDR

The problem statement first says that we have to launch the rocket with the help of the API. By inspecting the network tab in the chrome dev tools during the initial page load, we see that a get request is made to `/api/status?verbose=`. On accessing that page with the `verbose` parameter set to true, it gives us a list of api endpoints, one of which was `/api/rocketLaunch/`. On sending a POST request to that route with the required parameters, it asks us for a "frontend authorization token" for which we have to dig into the website source code. After finding the token and providing it along with the other parameters, it gives us the flag.

## Solving the challenge itself

On examining the requests made during the initial page load, we find a request being made to the API route `/api/status?verbose=`. 

![the api request](pictures/req.png)

On navigating to `/api/status?verbose=true`, it gives us a list of API endpoints.

![endpoints](pictures/endpoints.png)

The `/rocketLaunch` endpoint looks interesting, lets check it out. On navigating to the route in the browser, we are told that the "request body must be json". Looks like we have to make a POST request. For this, I prefer using something like [Insomnia](https://insomnia.rest) over cURL as I like the interface better, and its also better suited for beginners like myself, but you may use whatever you like.  

We could probably guess a parameter and pass it into the body of the POST request. A reasonable parameter would be `"rocket"`  to specify which rocket to launch, and the value could be `"apollo"`. Lets give that a try.

![trial1](pictures/trial1.png)

Hmm, looks like that didnt work. But the response was very useful, as now we know that we have the right parameter name `"rocket"`, but the value was wrong. That can easily be changed. 

![trial2](pictures/trial2.png)

Looks like we need to specify a `"launchTime"`. From the problem statement, we know that the rocket needs to be launched at noon. So lets try that.

![trial3](pictures/trial3.png)

Now lets add the pumpID parameter.

![trial4](pictures/trial4.png)

The fuel pump with the ID 1 doesn't seem to work. But the response did mention something about `/fuel/1`. So maybe we could try going to `/api/fuel/2` etc in the browser to find one that fits? On doing that, we find that a valid `"pumpID"` is 4. On plugging in the value 4.....

![trial5](pictures/trial5.png)

`"frontend authorization token not specified"`?????? What is the frontend authorization token?????? This had me scratching my head for quite a while, but eventually I got it. I started to look at the request initiator, and found that the first file in the call stack looked like some sort of source code. Lets take a look at that file.

![initiator](pictures/initiator.png)
![token](pictures/token.png)

Now that we have the token, lets try incorporating that into our request.

![trial6](pictures/trial6.png)

Huh? The same response again? But didn't the source code mention `Token: "yiLYDykacWp9sgPMluQeKkANeRFXyU3ZuxBrj2BQ"`. Yeah, I was thinking for a while on this. But its actually a pretty simple solution, don't worry.

![solution](pictures/solution.png)

Do you see the difference? Turns out that it was supposed to be `"token"` and not `"Token"`. Making the simple change gives us the flag. Nice and easy.

The final cURL request you can plug into your terminal to get the flag:

```bash
curl --request POST \
  --url https://space.sdc.tf/api/rocketLaunch \
  --header 'Content-Type: application/json' \
  --cookie __cfduid=d1c1486abdfe9252be96dea17b5e2282a1620531956 \
  --data '{
	"rocket": "triton",
	"launchTime": "12:00",
	"pumpID": 4,
	"token": "yiLYDykacWp9sgPMluQeKkANeRFXyU3ZuxBrj2BQ"
}'
```

## Thoughts

I think this challenge was a lot harder than the git-good challenge. The git-good challenge only involved you finding the `/.git/` directory, after which everything was really simple, while this challenge involved a lot digging for clues, even after finding the right route to post to. Experienced CTF players may find this challenge easy, but for a beginner like me, I found this "Easy" challenge harder than the "Medium" git-good challenge. Overall, a pretty fun challenge.
