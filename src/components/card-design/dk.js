const handleFollow = async () => { 
  if (alreadyLogin) { 
    let following = userData?.following || []; 
    let isFollowed = following?.includes(currentUserUid); 
    if (isFollowed) { 
      // remove
      for (let index in following) { 
        if (following[index] === currentUserUid) { 
          following.splice(index, 1); 
          break; 
        } 
      } 
    } else { 
      // add 
      following.push(currentUserUid); 
    } 
    // update data 
    const blogRef = doc(db, "users-dk-news-blog", userData?.userID); 
    await updateDoc(blogRef, { followers: following, }); 
  } else { 
    // setModelOpen(true); 
    alert("Please login to follow users."); 
  } 
};