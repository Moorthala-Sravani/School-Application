export const normalizeText = (value: unknown) =>
  String(value ?? '').trim().toLowerCase();

export const getParentEntityKeys = (profile: any, auth: any) => {
  const values = [
    profile?.id,
    profile?.parent_id,
    profile?.user_id,
    auth?.id,
    auth?.mobile,
    profile?.mobile_number,
    profile?.child_name,
  ];

  return values
    .map(value => normalizeText(value))
    .filter(Boolean);
};

export const belongsToParentChild = (item: any, profile: any, auth: any) => {
  const keys = getParentEntityKeys(profile, auth);
  const classKey = normalizeText(profile?.child_class);
  const childName = normalizeText(profile?.child_name);

  const itemKeys = [
    item?.parent_id,
    item?.parentId,
    item?.user_id,
    item?.userId,
    item?.student_id,
    item?.studentId,
    item?.receiver_id,
    item?.receiverId,
    item?.sender_id,
    item?.senderId,
    item?.mobile,
    item?.mobile_number,
    item?.student_mobile,
    item?.child_name,
    item?.student_name,
    item?.name,
  ].map(value => normalizeText(value));

  if (itemKeys.some(value => value && keys.includes(value))) {
    return true;
  }

  const itemClass = normalizeText(item?.child_class || item?.class_group || item?.class);
  const itemChildName = normalizeText(item?.child_name || item?.student_name || item?.name);

  if (childName && itemChildName && childName === itemChildName) {
    return true;
  }

  return !!classKey && !!itemClass && classKey === itemClass && !itemChildName;
};
