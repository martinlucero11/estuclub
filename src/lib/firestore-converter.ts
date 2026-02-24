import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
  DocumentData
} from "firebase/firestore";

export const createConverter = <T>(): FirestoreDataConverter<T> => ({
  toFirestore(data: T): DocumentData {
    return data as DocumentData;
  },
  fromFirestore(
    snapshot: QueryDocumentSnapshot,
    options: SnapshotOptions
  ): T {
    return {
      id: snapshot.id,
      ...snapshot.data(options),
    } as T;
  },
});
