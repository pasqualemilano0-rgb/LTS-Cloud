import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location("storage_lab", Path(__file__).resolve().parents[1] / "storage" / "lab.py")
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)

class StorageTests(unittest.TestCase):
    def test_owner_crud_and_folder(self):
        with lab.StorageLab() as s:
            a = s.put("alice","documents","demo.txt",b"synthetic")
            b = s.put("bob","archive","demo.txt",b"other")
            self.assertEqual(s.get("alice",a), b"synthetic")
            self.assertEqual([x["id"] for x in s.list("alice")],[a])
            self.assertEqual(s.list("alice","archive"),[])
            self.assertEqual(s.get("bob",b), b"other")
            for op in (s.get,s.delete):
                with self.assertRaises(FileNotFoundError): op("alice",b)
            with self.assertRaises(PermissionError): s.list("guest")
            with self.assertRaises(PermissionError): s.put("guest","archive","x.txt",b"x")
            s.delete("alice",a)
            self.assertEqual(s.list("alice"),[])
            with self.assertRaises(FileNotFoundError): s.get("alice",a)

    def test_validation_and_integrity(self):
        with lab.StorageLab() as s:
            for name in ("../x","a/../b","a\\b","..","/etc/passwd","bad\x00name","a"*81):
                with self.assertRaises(ValueError): s.put("alice","documents",name,b"x")
            with self.assertRaises(ValueError): s.put("alice","../outside","x",b"x")
            with self.assertRaises(ValueError): s.put("alice","documents","x",b"x"*(lab.MAX_BYTES+1))
            with self.assertRaises(ValueError): s.put("alice","documents","x",b"")
            a = s.put("alice","documents","x",b"abc")
            s.list("alice")[0]["sha256"]="fake"
            self.assertEqual(s.get("alice",a),b"abc")
            (s._root / a).write_bytes(b"bad")
            with self.assertRaises(ValueError): s.get("alice",a)
            with self.assertRaises(FileNotFoundError): s.get("alice","../outside")
            root = s._root
        self.assertFalse(root.exists())
        with self.assertRaises(RuntimeError): s.list("alice")

    def test_object_quota(self):
        with lab.StorageLab() as s:
            for i in range(20): s.put("alice","documents",f"x{i}",b"x")
            with self.assertRaises(ValueError): s.put("bob","archive","overflow",b"x")

if __name__ == "__main__":
    unittest.main(verbosity=2)
