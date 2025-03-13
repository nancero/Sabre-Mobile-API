
findAlertInArea
- find all alert is alerting
- filter to get near alert by get its latest geo location
=> user is alerting

findUserInArea
- find all latest location nearby (group by userid)
-> user of that location

flow:
1. Create alert: userId
  - nearbyUser = findUserInArea
  - create a socket room: alert-${userId}
  - add nearbyUser to alert-${userId} room
  - send message to all user in room

2. Update location
  2.1. User is alerting:
    - nearbyUser = findUserInArea
    - add nearbyUser to alert-${userId} room
    - send message to all user in room
  2.2. User is not alerting:
    - nearbyAlert = findAlertInArea
    - add user to alert-${nearbyAlert.userId} room
    - send message to this user


concern:
 - how to add user's socket to room?
 - when add new user to socket room, should send separate message to him about alert in his area.
=> add socketio's id to user database