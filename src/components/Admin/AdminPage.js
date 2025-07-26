import React, { useState, useEffect } from 'react';
import StaffHeader from '../Header/StaffHeader';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Select, 
  MenuItem, 
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import axios from 'axios';
import config from '../../config';

const AdminPage = () => {
  const [staffMembers, setStaffMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleUpdates, setRoleUpdates] = useState({});

  // Define handleRoleChange before it's used in the return
  const handleRoleChange = (id, newRole) => {
    setRoleUpdates(prev => ({
      ...prev,
      [id]: newRole
    }));
  };

  const saveRoleChange = async (id) => {
    try {
      const staff = staffMembers.find(s => s._id === id);
      if (!staff) return;

      const newRole = roleUpdates[id];
      const response = await axios.post(`${config.apiBaseUrl}/api/staff/assign-role`, { 
        email: staff.email,
        role: newRole 
      });

      if (response.data.success) {
        setStaffMembers(prev => 
          prev.map(staff => 
            staff._id === id ? { ...staff, role: newRole } : staff
          )
        );
        
        const { [id]: _, ...remainingUpdates } = roleUpdates;
        setRoleUpdates(remainingUpdates);
        
        alert('Role updated successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert(`Error: ${error.response?.data?.message || error.message}`);
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${config.apiBaseUrl}/api/staff/all`);
      const staffData = Array.isArray(response.data?.data) 
        ? response.data.data 
        : [];
      setStaffMembers(staffData);
    } catch (error) {
      console.error('Error fetching data:', error);
      setStaffMembers([]);
    } finally {
      setLoading(false);
      setRoleUpdates({});
    }
  };

  const filteredStaff = staffMembers.filter(staff => {
    const searchLower = searchTerm.toLowerCase();
    return (
      staff.name?.toLowerCase().includes(searchLower) ||
      staff.email?.toLowerCase().includes(searchLower) ||
      (staff.role || '').toLowerCase().includes(searchLower)
    );
  });

  if (loading) return <Typography>Loading...</Typography>;
  return (
    <Container maxWidth="lg"><StaffHeader></StaffHeader>
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Staff Management
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search staff by name, email or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Assign Roles
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Current Role</TableCell>
                  <TableCell>New Role</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((staff) => {
                  const pendingRole = roleUpdates[staff._id];
                  const hasPendingChange = pendingRole !== undefined;
                  
                  return (
                    <TableRow key={staff._id}>
                      <TableCell>{staff.name}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>{staff.role || 'No role assigned'}</TableCell>
                      <TableCell>
                        <Select
                          value={hasPendingChange ? pendingRole : (staff.role || '')}
                          onChange={(e) => handleRoleChange(staff._id, e.target.value)}
                          displayEmpty
                          size="small"
                          fullWidth
                        >
                          <MenuItem value="">Select Role</MenuItem>
                          <MenuItem value="Customer Service">Customer Service</MenuItem>
                          <MenuItem value="Customer Service Lead">Customer Service Lead</MenuItem>
                          <MenuItem value="CEO">CEO</MenuItem>
                          <MenuItem value="Tech Admin">Tech Admin</MenuItem>
                          <MenuItem value="staff">Staff</MenuItem>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          disabled={!hasPendingChange}
                          onClick={() => saveRoleChange(staff._id)}
                        >
                          Update
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminPage;